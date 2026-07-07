---
title: Storage backends
description: The store contracts behind Graphorin persistence - memory, sessions, workflow checkpoints, triggers, auth - with a default SQLite implementation and opt-in encryption-at-rest.
---

# Storage backends

Graphorin persists everything - memory tiers, sessions, workflow checkpoints,
triggers, auth tokens, OAuth server records, and idempotency keys - through a
small set of store contracts, defined in `@graphorin/core/contracts` (the
idempotency-key contract is the one adapter-local exception). The
default implementation is SQLite; encryption-at-rest is an opt-in sub-package.

This page complements [Persistence](/guide/persistence), which covers the
store contracts themselves.

## `@graphorin/store-sqlite` (default)

A single `better-sqlite3`-backed package satisfies **all** the store
contracts: `MemoryStore`, `CheckpointStore`, `SessionStore`, `TriggerStore`,
`AuthTokenStore`, `OAuthServerStore` (from `@graphorin/core/contracts`), and
its own package-local `IdempotencyStore`, plus embedding metadata.

- **WAL hardening** - every connection opens with a fixed pragma set
  (`journal_mode=WAL`, `synchronous=NORMAL`, `busy_timeout`, `foreign_keys=ON`,
  …). Deviations must be documented at the call site.
- **Vector search** - `sqlite-vec` (`vec0`) virtual tables, one per embedder
  id per indexed tier (facts / episodes / session messages), so switching
  embedders never mixes incompatible vectors.
- **Keyword search** - FTS5 with the `unicode61` tokenizer
  (`remove_diacritics 2`, tokenchars `-_.@/`) and `bm25()` ranking, fused with
  vector results via Reciprocal Rank Fusion by default, or calibrated weighted
  fusion (see [Rerankers & fusion](/guide/rerankers)). `unicode61` is
  multilingual-first: no English stemming (searches match word forms
  literally), but identifiers, emails, and paths tokenize as single terms and
  non-Latin scripts work out of the box.
- **Migrations** - applied inside transactions at startup. Test schema changes
  in staging first; a failed migration rolls back rather than half-applying.

```ts
import { openConnection } from '@graphorin/store-sqlite/connection';
// or use the higher-level store factory exported from the package root.
```

### Concurrency: what is safe while the server is live {#concurrency-matrix}

`better-sqlite3` is synchronous and SQLite is single-writer, so the model is:
**one writing service process per database file** - for multi-process
applications, front the store with the standalone server instead of opening
the file from several app processes. The specific exception the code
hardens for is **server + CLI on the same WAL-mode file**: the connection
layer applies `busy_timeout` (default 5000 ms, tunable via `busyTimeoutMs`)
and WAL checkpointing so the supported operator commands below work against
a live server.

| While the server is live | Commands |
|---|---|
| Safe (read-only) | `memory status/inspect/activity/why/review` (listing), `traces status`, `triggers list/status`, `audit verify/export`, `storage status`, `storage backup` (online page-level copy, safe under a live writer) |
| Works, but contends for the write lock | `memory review --promote`, `memory prune-history`, `traces prune`, `triggers disable/prune`, `consolidator dlq-clear`, `token create/revoke/rotate/rekey`, `secrets set/rotate/delete`, `audit prune`, `storage compact` |
| Requires a stopped server | `storage rekey` (fails fast with `database is locked`), `storage encrypt --swap` (refuses while another process holds the file), `graphorin migrate` when the CLI and server versions disagree |

::: warning Contended writes stall the server's event loop
Every contended statement blocks the calling thread synchronously for up to
`busy_timeout` (default 5 s). When a CLI write holds the lock, the **server's
next write freezes its whole event loop** for up to that long - including
`/v1/health` responses. Keep the "contends" commands to maintenance windows
on busy deployments, and see the
[standalone server guide](/guide/standalone-server) for the liveness-probe
implications.
:::

::: danger Never run `VACUUM`
The FTS5 keyword indexes are keyed to each base row's implicit `rowid`.
`VACUUM` may renumber implicit rowids, which would silently re-point every
search hit at the wrong record. Graphorin never issues `VACUUM`, and the
encrypted `encrypt` / `rekey` maintenance commands copy the database through
the online page-level backup (preserving rowids) - so use those, never a
hand-run `VACUUM`.
Each open runs a cheap FTS↔rowid integrity check and warns on drift; the same
check is exposed as `checkFtsIntegrity(connection)` (pass
`skipFtsIntegrityCheck: true` to `createSqliteStore` to disable the open-time
scan on very large stores).

`PRAGMA incremental_vacuum` is the rowid-safe counterpart: it relocates free
pages through the pointer map WITHOUT rebuilding tables, so implicit rowids -
and with them the FTS5 mappings - stay put. Every database Graphorin CREATES
from this version on is opened with `auto_vacuum=INCREMENTAL`, and
`graphorin storage compact` drives the vacuum in batches (after a
`wal_checkpoint(TRUNCATE)`) to return pruned pages to the OS.

Databases created BEFORE this version have `auto_vacuum=0` and keep their
high-water-mark file size forever: deleted pages are reused for new data but
never returned to the OS, and retrofitting `auto_vacuum` would require exactly
the `VACUUM` that is forbidden. `graphorin storage compact` detects this and
reports the limitation instead of touching the file; to actually reclaim disk,
initialise a fresh store (it gets `auto_vacuum=2`) and move the data across.
:::

## `@graphorin/store-sqlite-encrypted` (encryption-at-rest)

A drop-in that pulls the cipher peer (`better-sqlite3-multiple-ciphers`,
SQLCipher v4 compatible) and adds:

- `createEncryptedConnection` - open an encrypted DB (the cipher-selection
  pragmas are applied **before** `PRAGMA key`, so SQLCipher-v4 databases open
  correctly against the chacha20-defaulting peer).
- `encryptDatabase` / `rekeyDatabase` - back `graphorin storage encrypt` and
  `graphorin storage rekey`. The export is an **online page-level `backup()`
  copy → in-place `PRAGMA rekey`** sequence (CS-7): sqlite3mc ships no
  `sqlcipher_export`, and the page-level backup preserves implicit rowids so
  FTS5 mappings stay intact. Rekey drops to `journal_mode = DELETE` for the
  rotation (sqlite3mc refuses to rekey in WAL) and restores WAL after.
- `cipherIntegrityCheck` - runs the standard `PRAGMA integrity_check`
  through the keyed connection (sqlite3mc has no `cipher_integrity_check`);
  it runs automatically as the final verification step of both `encrypt`
  and `rekey`.

Defaults (ADR-030): cipher `sqlcipher` (`legacy=4`), **off by default** -
enable with `graphorin init --encrypted`. The audit DB is **always** encrypted
regardless of the opt-in.

### Passphrase strength

Empty passphrases are rejected outright. Choose a high-entropy passphrase from
a secret manager (see [Secrets](/guide/secrets)) - a placeholder such as a long
run of one character is weak even if it meets the length minimum. The server
pepper is held to the same bar via the framework's weak-secret detector.

```bash
graphorin init --encrypted          # scaffold an encrypted store
graphorin storage encrypt <db>      # convert an existing plaintext DB
graphorin storage rekey <db>        # rotate the passphrase
```

`storage encrypt --swap` replaces the plaintext file in place and **requires a
stopped server**: the swap renames the source, and a live writer would keep
committing into the renamed `.bak.<ts>` inode - those writes silently diverge
from the new encrypted database and are later deleted by
`storage cleanup-backups`. The command probes for a live connection and
refuses the swap when one is detected (best-effort: the probe-to-rename window
remains, so stopping the server is the rule, not the probe). Writes committed
between the snapshot and the swap live only in the `.bak.<ts>` file reported
as `swap.originalRenamedTo`. `storage rekey` on a live WAL database already
fails fast with "database is locked".

## Custom backends

Any backend that satisfies the store contracts (Postgres, libSQL, a cloud KV,
…) can replace SQLite - implement the contract(s) you need and pass the
instance into `createMemory(...)` / the server config. The contracts are the
only coupling point.
