[**Graphorin API reference v0.1.0**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/store-sqlite

# @graphorin/store-sqlite

> Default SQLite-backed persistence layer for the Graphorin framework.

`@graphorin/store-sqlite` implements every storage contract from
`@graphorin/core/contracts` on top of `better-sqlite3@^12.9.0` and
`sqlite-vec@~0.1.9`. It is the default storage adapter wired by every
higher-level package (`@graphorin/memory`, `@graphorin/sessions`,
`@graphorin/agent`, `@graphorin/workflow`, `@graphorin/server`,
`@graphorin/triggers`, …).

The package owns:

- **Connection lifecycle** — a single `better-sqlite3` connection in
  library mode; an opt-in `WorkerPool` wrapper (1 writer + N readers)
  in server mode. WAL hardening pragmas are mandatory:
  `journal_mode=WAL`, `synchronous=NORMAL`, `busy_timeout=5000`,
  `mmap_size=128 MiB`, `temp_store=MEMORY`, `cache_size=-64000`,
  `foreign_keys=ON`. A `CheckpointManager` performs periodic
  `PRAGMA wal_checkpoint(RESTART)` (default every 5 minutes; off in
  library mode) and surfaces `graphorin.storage.wal.size_bytes`.
- **Migration runner** — atomic, all-or-nothing per startup. Tracks
  applied versions in a `schema_migrations` row and supports
  resumable per-record vector migrations through the `migration_state`
  table. The bundled migrations cover every table the framework needs
  (memory tiers, checkpoints, sessions, triggers, auth tokens, OAuth
  servers, idempotency cache, consolidator state, conflict-check
  queue). Future packages register additional migration files here so
  every schema lives in one place.
- **Multi-embedder vec0 layout** — every memory record carries an
  `embedder_id` (canonical: `'<provider>:<model>@<dim>'`) and lives in
  a per-embedder `vec0` virtual table created lazily by
  `vector-table-mgr`. The default `lock-on-first` policy refuses
  silent embedder swaps; alternative policies (`auto-migrate`,
  `multi-active`) opt in through `createSqliteStore`.
- **Multilingual FTS5** — every `_fts` virtual table uses
  `unicode61 remove_diacritics 2 tokenchars '-_.@/'` so Cyrillic /
  diacritic / URL / email tokens index cleanly without per-language
  routing.
- **`MemoryStore`** — CRUD for the six tiers (working, session,
  episodic, semantic, procedural, shared). Search composition
  (RRF / re-ranking) lives in `@graphorin/memory`; the store ships only
  the raw `searchVector` / `searchFTS` / `searchExact` primitives.
- **`CheckpointStore`** — durable workflow checkpoints + per-task
  pending writes (resume safety after partial step failure).
- **`SessionStore`** — session metadata, agent registry, handoff
  records, workflow-run mapping. Per `DEC-147`, the `session_messages`
  rows themselves are owned by `MemoryStore` (single source of truth).
- **`TriggerStore`** — durable `trigger_state` rows for the
  `@graphorin/triggers` package.
- **`AuthTokenStore`** — server token records (HMAC-SHA256 hash + scope
  grammar; raw tokens are never persisted).
- **`OAuthServerStore`** — OAuth registration metadata; raw tokens live
  in `@graphorin/security`'s secret store and are referenced from here
  by `SecretRef` URI.
- **`IdempotencyStore`** — REST `Idempotency-Key` cache (consumed by
  `@graphorin/server`).
- **Encryption hook** — interface-only in v0.1; default OFF. If the
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

const store = createSqliteStore({
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

## Server mode (WorkerPool)

```ts
const store = createSqliteStore({
  path: './assistant.db',
  mode: 'server',
  workerPool: {
    readers: 4,
    walCheckpointIntervalMs: 5 * 60 * 1000,
  },
});
```

## Migrations

Migrations are applied automatically on `store.init()`. The bundled set
covers every Phase 05 deliverable:

| Number | File                | Owner       |
|-------:|---------------------|-------------|
| 001    | `001-memory.sql`    | memory      |
| 002    | `002-checkpoints.sql` | workflow  |
| 003    | `003-sessions.sql`  | sessions    |
| 004    | `004-triggers.sql`  | triggers    |
| 005    | `005-auth-tokens.sql` | server    |
| 006    | `006-oauth-servers.sql` | mcp client |
| 007    | `007-trigger-meta.sql` | triggers (catchup window) |
| 008    | `008-idempotency.sql` | server     |
| 009    | `009-consolidator.sql` | memory     |
| 010    | `010-conflict-check.sql` | memory   |

The runner is idempotent — re-running on a fully-migrated database
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

**Project Graphorin** · v0.1.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/store-sqlite/README.md) | @graphorin/store-sqlite — default SQLite-backed persistence layer for the Graphorin framework. |
| [connection](/api/@graphorin/store-sqlite/connection/index.md) | - |
| [encryption](/api/@graphorin/store-sqlite/encryption/index.md) | Encryption-at-rest interface hooks. |
| [migrations](/api/@graphorin/store-sqlite/migrations/index.md) | Migration registry + runner for `@graphorin/store-sqlite`. |
