# @graphorin/store-sqlite

> Default SQLite-backed persistence layer for the Graphorin framework.

`@graphorin/store-sqlite` implements every storage contract from
`@graphorin/core/contracts` on top of `better-sqlite3@^12.9.0` and
`sqlite-vec@~0.1.9`. It is the default storage adapter wired by every
higher-level package (`@graphorin/memory`, `@graphorin/sessions`,
`@graphorin/agent`, `@graphorin/workflow`, `@graphorin/server`,
`@graphorin/triggers`, …).

The package owns:

- **Connection lifecycle** - a single synchronous `better-sqlite3`
  connection in BOTH modes; `mode: 'server'` only auto-starts the
  periodic WAL checkpoint timer, `mode: 'lib'` starts it when
  `walCheckpointIntervalMs` is set explicitly. WAL hardening pragmas
  are mandatory:
  `journal_mode=WAL`, `synchronous=NORMAL`, `busy_timeout=5000`,
  `mmap_size=128 MiB`, `temp_store=MEMORY`, `cache_size=-64000`,
  `foreign_keys=ON`. A `CheckpointManager` performs periodic
  `PRAGMA wal_checkpoint(RESTART)` (default every 5 minutes; off in
  library mode) and surfaces `graphorin.storage.wal.size_bytes`.
- **Migration runner** - atomic, all-or-nothing per startup. Tracks
  applied versions in a `schema_migrations` row and supports
  resumable per-record vector migrations through the `migration_state`
  table. The bundled migrations cover every table the framework needs
  (memory tiers, checkpoints, sessions, triggers, auth tokens, OAuth
  servers, idempotency cache, consolidator state, conflict-check
  queue). Future packages register additional migration files here so
  every schema lives in one place.
- **Multi-embedder vec0 layout** - every memory record carries an
  `embedder_id` (canonical: `'<provider>:<model>@<dim>'`) and lives in
  a per-embedder `vec0` virtual table created lazily by
  `vector-table-mgr`. The default `lock-on-first` policy refuses
  silent embedder swaps; alternative policies (`auto-migrate`,
  `multi-active`) opt in through `createSqliteStore`.
- **Multilingual FTS5** - every `_fts` virtual table uses
  `unicode61 remove_diacritics 2 tokenchars '-_.@/'` so Cyrillic /
  diacritic / URL / email tokens index cleanly without per-language
  routing.
- **`MemoryStore`** - CRUD for the six tiers (working, session,
  episodic, semantic, procedural, shared). Search composition
  (RRF / re-ranking) lives in `@graphorin/memory`; the store ships only
  the raw `searchVector` / `searchFTS` / `searchExact` primitives.
- **`CheckpointStore`** - durable workflow checkpoints + per-task
  pending writes (resume safety after partial step failure).
- **`SessionStore`** - session metadata, agent registry, handoff
  records, workflow-run mapping. Per `DEC-147`, the `session_messages`
  rows themselves are owned by `MemoryStore` (single source of truth).
- **`TriggerStore`** - durable `trigger_state` rows for the
  `@graphorin/triggers` package.
- **`AuthTokenStore`** - server token records (HMAC-SHA256 hash + scope
  grammar; raw tokens are never persisted).
- **`OAuthServerStore`** - OAuth registration metadata; raw tokens live
  in `@graphorin/security`'s secret store and are referenced from here
  by `SecretRef` URI.
- **`IdempotencyStore`** - REST `Idempotency-Key` cache (consumed by
  `@graphorin/server`).
- **Encryption hook** - interface-only in v0.1; default OFF. If the
  caller passes `encryption.enabled: true`, the connection layer
  resolves the configured passphrase resolver and looks up
  `better-sqlite3-multiple-ciphers`; if the cipher peer is missing, the
  call **fails fast** with an actionable error. The full cipher path
  ships in the optional `@graphorin/store-sqlite-encrypted` subpackage
  (Phase 16).

## Install

The package depends on the native peers `better-sqlite3` and
`sqlite-vec`:

```bash
pnpm add @graphorin/store-sqlite better-sqlite3 sqlite-vec
```

For encryption-at-rest, additionally install the cipher peer (default
OFF; opt in via `createSqliteStore({ encryption: { enabled: true } })`):

```bash
pnpm add better-sqlite3-multiple-ciphers
```

## Quick start

```ts
import { createSqliteStore } from '@graphorin/store-sqlite';

const store = await createSqliteStore({
  path: './assistant.db',
  mode: 'lib',
});

await store.init();
await store.memory.semantic.remember({
  id: 'fact-1',
  kind: 'semantic',
  userId: 'alex',
  sensitivity: 'internal',
  text: 'Loves mountain hiking.',
  createdAt: new Date().toISOString(),
});

await store.close();
```

## Server mode

```ts
const store = await createSqliteStore({
  path: './assistant.db',
  mode: 'server',
  walCheckpointIntervalMs: 5 * 60 * 1000,
});
```

The only difference from `'lib'` is lifecycle wiring: `'server'`
auto-starts the periodic `PRAGMA wal_checkpoint(RESTART)` timer
(`walCheckpointIntervalMs`, default 5 minutes), while `'lib'` runs it
only when the interval is passed explicitly. There is no worker pool
and no reader fan-out - a single synchronous connection serves both
modes. For what is safe to run against the file while a server holds
it, see the
[concurrency matrix](https://graphorin.com/guide/storage#concurrency-matrix).

## Migrations

Migrations are applied automatically on `store.init()`. The bundled set
currently runs `001` through `028` (`src/migrations/`):

| Range | What it covers | Owner |
|---|---|---|
| 001-010 | Core tables: memory, checkpoints, sessions, triggers (+ catch-up meta), auth tokens, OAuth servers, idempotency, consolidator state, conflict-check queue. | memory / workflow / sessions / triggers / server / mcp |
| 011-017 | The memory program: fact conflicts, provenance + quarantine, insights, fact importance, the entity graph, procedures. | memory |
| 018-023 | Consolidator + runtime hygiene: reflection watermark, DLQ phase, rule success counters, run counters, session sequence uniqueness, dead-column cleanup. | memory / sessions |
| 024 | Durable span sink (`spans` table) for replay + `memory why`. | observability |
| 025-028 | 0.6.0 additions: fact-supersede indexes, the memory `owner` principal column, per-fact access counters, rules FTS. | memory |

The runner is idempotent - re-running on a fully-migrated database
skips every applied migration. A migration is wrapped in a
transaction; a failure rolls the whole step back, leaving the DB
exactly as it was before the run.

The `audit.db` file (Phase 03) is opened separately by
`@graphorin/security`. `@graphorin/store-sqlite` only owns the file
management hook (path resolution + parent-dir creation + cipher peer
verification).

## License

MIT © 2026 Oleksiy Stepurenko.

---

**Project Graphorin** · v0.13.4 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
