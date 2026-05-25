# Storage backends

Graphorin persists everything — memory tiers, sessions, workflow checkpoints,
triggers, auth tokens, OAuth server records, and idempotency keys — through a
small set of store contracts defined in `@graphorin/core/contracts`. The
default implementation is SQLite; encryption-at-rest is an opt-in sub-package.

This page complements [Persistence](/guide/persistence), which covers the
store contracts themselves.

## `@graphorin/store-sqlite` (default)

A single `better-sqlite3`-backed package satisfies **all** the store
contracts: `MemoryStore`, `CheckpointStore`, `SessionStore`, `TriggerStore`,
`AuthTokenStore`, `OAuthServerStore`, and `IdempotencyStore`, plus embedding
metadata.

- **WAL hardening** — every connection opens with a fixed pragma set
  (`journal_mode=WAL`, `synchronous=NORMAL`, `busy_timeout`, `foreign_keys=ON`,
  …). Deviations must be documented at the call site.
- **Vector search** — `sqlite-vec` (`vec0`) virtual tables, one per embedder
  id, so switching embedders never mixes incompatible vectors.
- **Keyword search** — FTS5 with the porter tokenizer and `bm25()` ranking,
  fused with vector results via Reciprocal Rank Fusion by default, or calibrated
  weighted fusion (see [Rerankers & fusion](/guide/rerankers)).
- **Migrations** — applied inside transactions at startup. Test schema changes
  in staging first; a failed migration rolls back rather than half-applying.

```ts
import { openConnection } from '@graphorin/store-sqlite/connection';
// or use the higher-level store factory exported from the package root.
```

::: tip Concurrency
`better-sqlite3` is synchronous; the store is safe for a single Node process.
For multi-process deployments, front it with the standalone server rather than
opening the same file from several processes.
:::

## `@graphorin/store-sqlite-encrypted` (encryption-at-rest)

A drop-in that pulls the cipher peer (`better-sqlite3-multiple-ciphers`,
SQLCipher v4 compatible) and adds:

- `createEncryptedConnection` — open an encrypted DB.
- `encryptDatabase` / `rekeyDatabase` — back `graphorin storage encrypt` and
  `graphorin storage rekey`.
- `cipherIntegrityCheck` — backs the daily verification cron and
  `/v1/health/storage`.

Defaults (ADR-030): cipher `sqlcipher` (`legacy=4`), **off by default** —
enable with `graphorin init --encrypted`. The audit DB is **always** encrypted
regardless of the opt-in.

### Passphrase strength

Empty passphrases are rejected outright. Choose a high-entropy passphrase from
a secret manager (see [Secrets](/guide/secrets)) — a placeholder such as a long
run of one character is weak even if it meets the length minimum. The server
pepper is held to the same bar via the framework's weak-secret detector.

```bash
graphorin init --encrypted          # scaffold an encrypted store
graphorin storage encrypt <db>      # convert an existing plaintext DB
graphorin storage rekey <db>        # rotate the passphrase
```

## Custom backends

Any backend that satisfies the store contracts (Postgres, libSQL, a cloud KV,
…) can replace SQLite — implement the contract(s) you need and pass the
instance into `createMemory(...)` / the server config. The contracts are the
only coupling point.
