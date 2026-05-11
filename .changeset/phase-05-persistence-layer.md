---
'@graphorin/store-sqlite': minor
'@graphorin/embedder-transformersjs': minor
'@graphorin/embedder-ollama': minor
'@graphorin/triggers': minor
---

Phase 05 — persistence layer. Four new packages join the Graphorin
framework on top of the foundations from Phase 02
(`@graphorin/core`), Phase 03 (`@graphorin/security`), and Phase 04
(`@graphorin/observability` + `@graphorin/pricing`). After this
phase, every later module has a place to write to.

`@graphorin/store-sqlite` ships:

- **`createSqliteStore({...})`** — composite factory that opens a
  single `better-sqlite3@^12.9.0` connection (or an opt-in
  `WorkerPool` wrapper for server mode), applies the mandatory WAL
  hardening pragmas (`journal_mode = WAL`, `synchronous = NORMAL`,
  `busy_timeout = 5000`, `mmap_size = 134217728`,
  `temp_store = MEMORY`, `cache_size = -64000`, `foreign_keys = ON`),
  loads the `sqlite-vec@~0.1.9` peer, and runs the bundled migration
  set inside a single transactional startup.
- **Atomic migration runner** (`runMigrations(...)`,
  `listMigrations(...)`, `registerMigration(...)`) plus the bundled
  10 SQL files: memory tables (`001-memory.sql`), workflow
  checkpoints (`002-checkpoints.sql`), sessions / agents / handoffs
  (`003-sessions.sql`), durable trigger state (`004-triggers.sql`),
  server auth tokens (`005-auth-tokens.sql`), OAuth servers
  (`006-oauth-servers.sql`), trigger fire log
  (`007-trigger-meta.sql`), REST idempotency cache
  (`008-idempotency.sql`), consolidator state + DLQ
  (`009-consolidator.sql`), conflict-check queue
  (`010-conflict-check.sql`). Re-running on a fully-migrated DB is a
  no-op; an after-the-fact edit to an already-applied migration
  fails fast.
- **Multi-table per-embedder vec0 layout** — `EmbeddingMetaRepository`
  registers every embedder once; `VectorTableManager` lazy-creates
  the `facts_vec_<slug>` / `episodes_vec_<slug>` /
  `session_messages_vec_<slug>` virtual tables on first write per
  `(entity, embedder_id)`. The default `'lock-on-first'` policy
  rejects a second active embedder with an explicit error pointing
  at the `graphorin memory migrate` flow; `'multi-active'` is opt-in.
- **Multilingual FTS5** — every `_fts` virtual table uses the
  canonical tokenizer
  `unicode61 remove_diacritics 2 tokenchars '-_.@/'` so Cyrillic /
  diacritic / URL / email tokens index without per-language routing.
- **Every storage contract from `@graphorin/core/contracts`**:
  `MemoryStore` (six tiers — working / session / episodic /
  semantic / procedural / shared), `CheckpointStore` (per-task
  pending writes for resume safety), `SessionStore` (sessions +
  `agents_registry` + `session_handoffs` +
  `session_workflow_runs`), `TriggerStore`, `AuthTokenStore`,
  `OAuthServerStore`, plus a brand-new `IdempotencyStore` consumed
  by the upcoming `@graphorin/server` package (Phase 14).
- **Encryption-at-rest hook** — `EncryptionConfig` declares the
  passphrase resolver + cipher selection; default OFF. When
  `encryption.enabled: true`, the connection layer loads
  `better-sqlite3-multiple-ciphers` lazily and applies
  `PRAGMA key = <SQL-literal>`. If the cipher peer is missing, the
  call fails fast with `CipherPeerMissingError` — the framework
  never silently downgrades to an unencrypted DB. The full cipher
  path lands in `@graphorin/store-sqlite-encrypted` (Phase 16).
- **`audit.db` opener** — `openAuditDatabase({...})` separately opens
  the encrypted audit database that `@graphorin/security` writes to.
  Encryption is mandatory; the cipher peer is required.
- **`WalCheckpointManager`** — periodic `wal_checkpoint(RESTART)`
  worker (default every 5 min in server mode; off in library mode
  unless explicitly set). Surfaces `readWalSize(conn)` for
  `graphorin.storage.wal.size_bytes` metrics in Phase 14.

`@graphorin/embedder-transformersjs` ships:

- **`createTransformersJsEmbedder({...})`** — wraps
  `@huggingface/transformers@^4.1.0`. Default model
  `Xenova/multilingual-e5-base` (768-dim, multilingual; DEC-130 /
  ADR-025). Implements `EmbedderProvider` with deterministic
  `configHash()`, batched embed, lazy pipeline construction,
  honours `process.env.GRAPHORIN_CACHE_DIR`, and surfaces
  `EmbedderModelLoadError` with a pointer to the offline-install
  flow when the model cannot be fetched.
- **Known-dim seed table** for the v0.1 multilingual family
  (`multilingual-e5-small/base/large`, `bge-m3`, the standard
  `all-MiniLM-L6-v2-ONNX` reference) so the canonical id is stable
  before the first `embed()` call.
- **`canonicalConfigHash(...)`** — exported helper that produces a
  deterministic SHA-256 hash over an object with stable key
  ordering; reused by every embedder in the Graphorin ecosystem.

`@graphorin/embedder-ollama` ships:

- **`createOllamaEmbedder({...})`** — first-class opt-in alternative
  to the bundled-model transformers.js adapter (per RB-56 /
  DEC-172 / ADR-060 — promoted from post-MVP). Talks to a local
  Ollama instance through `POST /api/embed` (batch path) with an
  automatic fallback to the legacy `POST /api/embeddings` (per
  text) when the batch endpoint returns `404`.
- **Four model-family fixtures**: `nomic-embed-text` (default,
  768-dim, multilingual), `mxbai-embed-large` (1024-dim),
  `snowflake-arctic-embed` (1024-dim), `bge-m3` (1024-dim,
  multilingual). Per-record `embedder_id` carries the Ollama model
  digest from `POST /api/show`, so a model upgrade in the same
  Ollama instance produces a different `embedder_id` and
  `lock-on-first` correctly fires a clean migration path instead of
  silently re-using vectors.
- **No native peers** — the embedder uses the platform `fetch` API
  only (allowed-listed in `scripts/check-no-network.mjs` per the
  `packages/embedder-*/` convention from `docs/00-meta/PRIVACY.md`).
  Test suite drives the embedder through an in-memory mock fetch
  against pinned response fixtures.

`@graphorin/triggers` ships:

- **`createScheduler({ store })`** — process-bound scheduler with the
  same code path in library and server modes (DEC-150). Runs cron /
  interval / idle / event triggers; persists their state via the
  `TriggerStore` contract from `@graphorin/core/contracts`.
- **In-tree 5-field cron parser** (`parseCron(...)`,
  `nextFireAfter(...)`) — supports `*`, single values, lists,
  ranges, and steps. Strict by design: a malformed expression
  raises `CronParseError` at registration time, never silently
  never-fires.
- **Catch-up policies** — `'none'` default (safest for
  personal-assistant flows), `'last'` (fire once on resume), `'all'`
  (fire each missed run within `catchupWindowMs`, capped at
  `maxCatchupRuns`).
- **AsyncIterable lifecycle event stream** (`scheduler.events()`)
  surfacing `started` / `stopped` / `registered` / `fire-start` /
  `fire-end` / `fire-error` / `catchup-applied` /
  `lib-mode-warning` records — useful for observability and tests.
- **One-time per-process library-mode WARN** — emitted on the first
  `register(...)` call from a lib-mode scheduler unless
  `acknowledgeLibMode: true` is supplied.

Repository hygiene:

- `pnpm.onlyBuiltDependencies` extends the existing `esbuild` slot
  with `better-sqlite3` and `sqlite-vec` so the native peers
  compile cleanly inside the `pnpm install` flow.
- `scripts/check-no-network.mjs` already allow-listed
  `packages/embedder-*/` and `packages/store-*/` for the documented
  embedder model download + storage backend code paths; the new
  packages slot in without changing the allow-list.
- The bundled migration `*.sql` files are copied to the published
  `dist/migrations/` directory by a tiny build hook
  (`scripts/copy-migrations.mjs`) so the runtime registry can read
  them after the bundler runs.
