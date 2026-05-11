---
'@graphorin/memory': minor
'@graphorin/store-sqlite': minor
---

Phase 10a — initial release of `@graphorin/memory`. The new package
ships the heart of the Graphorin framework: the six-tier memory
model + the nine memory tools + the hybrid search composition + the
embedder migration runner, all wired through the new
`createMemory()` facade. After this phase the agent runtime
(Phase 12), the standalone server (Phase 14), and the CLI
(Phase 15) have a single typed entry point for every memory
operation.

`@graphorin/memory` ships:

- **`createMemory()` facade.** `createMemory({ store, embeddings,
  embedder?, workingBlocks?, tracer?, reranker?, resolveScope?,
  consolidator? })` wires every six-tier sub-module + the nine
  memory tools + the search reranker + the context engine /
  consolidator interface stubs in one call. Returns a typed
  `Memory` handle (`memory.working`, `memory.session`,
  `memory.episodic`, `memory.semantic`, `memory.procedural`,
  `memory.shared`, `memory.tools`, `memory.consolidator`,
  `memory.compile()`, `memory.metadata()`).
- **Six tier sub-modules.** `WorkingMemory` (block CRUD + XML
  compile + truncate / reject overflow policy + per-agent
  `attach`/`detach` wrappers around the shared join table),
  `SessionMemory` (append-only message log + FTS5 search +
  spec-aligned `shouldCompact(scope, contextWindow)` signature
  that prefers the storage adapter's per-message `token_count`
  cache from DEC-131 and falls back to a `~4 chars/token`
  heuristic on cache miss), `EpisodicMemory` (record + recent +
  triple-signal recall via recency × relevance × importance +
  soft-`archive` for adapters that opt in), `SemanticMemory`
  (hybrid vector + FTS5 search + `setReranker(...)` hook +
  `get(factId)` lookup + soft-`forget` + GDPR-grade `purge`
  hard-delete + supersede chain), `ProceduralMemory` (define +
  activate with `'always' | 'topic=...' | 'tag=...'` predicate
  vocabulary), `SharedMemory` (M2M attach mode for blocks /
  facts / rules across multiple agents).
- **Nine memory tools.** Every tool uses the typed `tool({...})`
  builder from `@graphorin/tools` with Zod-shaped `inputSchema` /
  `outputSchema`, the right `memoryGuardTier` (per DEC-153), the
  right `sideEffectClass`, and a `resolveScope` resolver that the
  agent runtime overrides in Phase 12: `block_append`,
  `block_replace`, `block_rethink`, `fact_remember`, `fact_search`,
  `fact_supersede`, `fact_forget`, `recall_episodes`,
  `conversation_search`. Stable order — `buildMemoryTools(deps)`
  guarantees the indices.
- **Built-in `RRFReranker` (k=60 default).** Reciprocal Rank
  Fusion across vector + FTS5 ranked lists per ADR-024 / DEC-120;
  surfaces per-list contribution signals so callers can debug
  ranking decisions. `setReranker(custom)` swap hook accepts any
  `ReRanker` implementation (cross-encoder, LLM judge, custom).
  The pure-functional `fuseRrf(lists, k)` core is exported for
  callers that already collected the candidate lists themselves.
- **Embedder migration runner.** `migrateEmbedder({ source, target,
  embeddings, strategy, batchSize?, maxRecordsPerKind?, nextBatch?,
  signal? })` returns an `AsyncGenerator<MigrationProgress>`. Three
  strategies per ADR-023 / DEC-116:
    - `'lock-on-first'` (default) — refuses silent embedder swap
      with `EmbedderMigrationLockedError`; points at
      `graphorin memory migrate` (Phase 15).
    - `'multi-active'` — registers the target alongside the source
      so reads union both vec0 tables while a migration is in
      flight.
    - `'auto-migrate'` — re-embeds source rows in resumable
      batches via the supplied `nextBatch` hook (the storage
      adapter wires it to its `migration_state` cursor); honours
      `AbortSignal` and yields a final `'aborted'` event before
      throwing `EmbedderMigrationAbortedError`.
- **Per-record embedder enforcement.** `createMemory({ embedder,
  embeddings })` registers the configured embedder via the
  storage adapter's `EmbeddingMetaRegistryLike` registry on first
  call; semantic + episodic writes carry the canonical embedder
  id (`'<adapter>:<model>@<dim>'`) on every embedded payload.
- **Default-on bi-temporal storage.** Fact writes default to
  `validFrom = now`, `validTo = null`; supersede chains soft-link
  the new record to the old one and preserve the old record for
  replay. The advanced `as_of_date` query API is opt-in
  (post-MVP).
- **Multi-agent attribution.** Session writes preserve
  `assistantMessage.agentId` end-to-end; `Session.list({ agentId
  })` filters per-agent; `Session.attributedFor(scope)` is a stub
  that Phase 11 wires through to the `agents_registry` table.
- **`memory.compile(scope)` + `memory.metadata(scope)`.** The
  `Memory` interface ships the deterministic minimum-viable
  rendering: `<memory_blocks>` + `<memory_rules>` +
  `<memory_metadata>` XML fragments. Phase 10d replaces the
  `compile(...)` body with the full six-layer locale-aware
  template + privacy filter + token budget; the interface is
  stable today so the agent runtime can wire it without later
  type churn.
- **`Consolidator` placeholder.** `createConsolidatorPlaceholder`
  honours the `Consolidator` interface (`start / stop / trigger /
  status`) but does no background work. Phase 10c replaces the
  factory with the full triggers + 3-phase pipeline + DLQ + cost
  budget per DEC-133 / DEC-134 / ADR-038. The default tier is
  `'free'` so no LLM calls fire until the operator opts in.
- **AISpan emission for every operation.** Each tier method runs
  inside `tracer.span({ type: 'memory.<read|write|search>.<tier>',
  attrs })` with sanitized scope attributes
  (`memory.scope.user_id`, `memory.scope.session_id`,
  `memory.scope.agent_id`) plus per-operation counters
  (`memory.read.<tier>.count`, `memory.search.<tier>.fts_count`,
  `memory.search.<tier>.vector_count`,
  `memory.search.semantic.reranker_id`, …). Compatible with the
  `Tracer` contract from `@graphorin/core` so the no-op tracer is
  a drop-in for unit tests.
- **Memory-modification guard wiring.** Each tool declares the
  appropriate `memoryGuardTier` per DEC-153: `'memory-aware'` for
  every mutation tool (`block_append`, `block_replace`,
  `block_rethink`, `fact_remember`, `fact_supersede`,
  `fact_forget`); `'pure'` for the read-only tools (`fact_search`,
  `recall_episodes`, `conversation_search`). The
  `@graphorin/tools` executor reads the tier and dispatches the
  correct guard variant via `createGuard(...)` from
  `@graphorin/security/guard`.
- **Typed errors.** `GraphorinMemoryError` (abstract base) +
  `EmbedderRegistrationError`, `MemoryToolDeniedError`,
  `WorkingBlockOverflowError`,
  `WorkingBlockReplaceMismatchError`,
  `EmbedderMigrationLockedError`,
  `EmbedderMigrationAbortedError`,
  `EmbedderMigrationStateError`. Every error carries a stable
  lowercase `kind` discriminator and an optional actionable
  `hint`.
- **Storage adapter contract.** `MemoryStoreAdapter` widens the
  typed `MemoryStore` from `@graphorin/core` with optional
  extension methods every adapter is free to opt into:
  `semantic.rememberWithEmbedding` / `semantic.searchVector` /
  `semantic.get` / `semantic.purge`,
  `episodic.putWithEmbedding` / `episodic.searchVector` /
  `episodic.archive`,
  `session.searchVector` / `session.totalCachedTokens`. The
  default `@graphorin/store-sqlite` adapter implements every
  member by construction (the new `get`, `purge`, `archive`,
  and `totalCachedTokens` ship as additive Phase 10a deliverables
  on the sqlite store); in-memory test doubles implement the
  minimum and surface a friendly `TypeError` from the memory
  tier when an opt-in extension is missing.

`pnpm test` — 79 new tests across the `@graphorin/memory` package
plus 3 new tests on the `@graphorin/store-sqlite` extension methods
covering: every tier's CRUD round-trip; the working-block overflow
policy (`'truncate'` default + `'reject'` opt-in); the unique
substring guard on `block_replace`; per-agent block
attach/detach; the spec-aligned `compile(scope, agentId?)`
signature; the default scope-resolver throwing diagnostic;
deterministic XML compile output; the nine memory tools'
end-to-end execution against an in-memory store fixture; the
memory-modification guard tier annotation matrix;
`SemanticMemory.get` / `purge` / `forget` lifecycle paths
(soft-delete vs hard-delete); `EpisodicMemory.archive` /
`get(null-on-archived)`; the friendly `TypeError` raised when an
adapter omits an opt-in extension; the spec-aligned
`SessionMemory.shouldCompact(scope, contextWindow: number)`
signature; the per-message `token_count` cache wired through to
`shouldCompact` (DEC-131); the RRFReranker default `k = 60`
constant; the rank-1-in-two-lists ranking property; the
property-based fuse-permutation invariance (50 fast-check runs);
the **custom-reranker reordering** end-to-end against
`SemanticMemory.search` (DoD checklist item); the embedder
migration runner's three strategies (locked-error path;
multi-active commit + active registry assertion; auto-migrate
batched stream + retire); `AbortSignal` propagation; the
**auto-migrate resumability after a simulated process kill** —
two consecutive `migrateEmbedder(...)` invocations against a
stateful queue drain the source completely (DoD checklist item);
the **multi-active read union** verified through the per-record
`embedder_id` storage guard from ADR-023 / DEC-116 (DoD
checklist item); the `nextBatch`-required diagnostic; identical
source / target collision; the multilingual fixture corpus
(English + Spanish + French + German + Portuguese — every locale
retrievable via the default `RRFReranker`); end-to-end AISpan
emission across every memory operation with status `'ok'` and
per-tier scope attributes; the `Consolidator` placeholder
lifecycle; the static `SemanticMemory.fuseRrf`; every typed
error class's stable `kind` discriminator + actionable `hint`;
plus a dedicated `tests/integration-sqlite.test.ts` suite that
exercises every tier surface, `compile()`/`metadata()`,
embedded writes via the production sqlite + sqlite-vec adapter,
the `totalCachedTokens` integration path, and the nine memory
tool registrations against a real `@graphorin/store-sqlite`
instance. Coverage: 97.17 % statements, 84.67 % branches,
98.16 % functions, 97.17 % lines — well above the package's
`≥ 85 %` thresholds set per the Phase 10a acceptance criteria.
Workspace-wide: every other package's tests remain green; the
`@graphorin/store-sqlite` package adds 3 new tests for the
extension methods (`semantic.get` / `semantic.purge` /
`episodic.archive` / `session.totalCachedTokens`); `pnpm run
check-no-network: PASS`; `pnpm run build` succeeds for every
package.
