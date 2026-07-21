# @graphorin/store-sqlite

## 0.13.10

### Patch Changes

- [#237](https://github.com/o-stepper/graphorin/pull/237) [`7d47994`](https://github.com/o-stepper/graphorin/commit/7d4799415263d72e4c6744362504b290b55fade4) Thanks [@o-stepper](https://github.com/o-stepper)! - README concurrency-matrix link now points at `docs.graphorin.com` (eleventh deep retest P2). The previous link put the `/guide/storage` path on the bare landing domain, which serves no docs paths - a live 404 - and the new repo-wide `check-doc-links` gate keeps the whole class out.

- Updated dependencies []:
  - @graphorin/core@0.13.10
  - @graphorin/observability@0.13.10

## 0.13.9

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.9
  - @graphorin/observability@0.13.9

## 0.13.8

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.8
  - @graphorin/observability@0.13.8

## 0.13.7

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.7
  - @graphorin/observability@0.13.7

## 0.13.6

### Patch Changes

- Updated dependencies [[`6715ad4`](https://github.com/o-stepper/graphorin/commit/6715ad451e5617c882d282c7f2b2ce67ebd1e4ac)]:
  - @graphorin/observability@0.13.6
  - @graphorin/core@0.13.6

## 0.13.5

### Patch Changes

- [#224](https://github.com/o-stepper/graphorin/pull/224) [`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6) Thanks [@o-stepper](https://github.com/o-stepper)! - Every type referenced by a public API is now exported from a documented barrel - about 130 previously unreachable types (memory tool input/output shapes, executor and truncation hooks, audit listener signatures, protocol frame schemas, sandbox peer-module views, new core agent-event variants, and more) became importable, clearing all 115 TypeDoc referenced-but-not-included warnings. Three previously file-local names were renamed while being made public: the tools audit listener is `ToolAuditListener`, the memory-guard listener is `MemoryGuardAuditListener`, the secret-value listener is `SecretValueAuditListener`, and the built-in tool-search match row is `ToolSearchToolMatch` (the registry-level `ToolSearchMatch` is unchanged). None of these were importable before, so no consumer code breaks.

- Updated dependencies [[`e80d6af`](https://github.com/o-stepper/graphorin/commit/e80d6af60cbad7352b2ebaf35bcef45b91989ce6)]:
  - @graphorin/core@0.13.5
  - @graphorin/observability@0.13.5

## 0.13.4

### Patch Changes

- Updated dependencies [[`a17f82d`](https://github.com/o-stepper/graphorin/commit/a17f82dc46be7727afbf7ceea22bfe788b8d1171)]:
  - @graphorin/observability@0.13.4
  - @graphorin/core@0.13.4

## 0.13.3

### Patch Changes

- Updated dependencies [[`1cdec71`](https://github.com/o-stepper/graphorin/commit/1cdec71b5a8bd4ed9dbbd283eb7bf578886088f8)]:
  - @graphorin/observability@0.13.3
  - @graphorin/core@0.13.3

## 0.13.2

### Patch Changes

- Updated dependencies [[`bba9048`](https://github.com/o-stepper/graphorin/commit/bba9048043fe97ce623079700f0e93b4b7705425)]:
  - @graphorin/core@0.13.2
  - @graphorin/observability@0.13.2

## 0.13.1

### Patch Changes

- [#209](https://github.com/o-stepper/graphorin/pull/209) [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4) Thanks [@o-stepper](https://github.com/o-stepper)! - Public TSDoc no longer carries internal audit/work-item ticket ids ("deep retest P1-3", "W-135", wave letters, finding families): roughly 1100 docblock sites across 28 packages were rewritten to describe the behaviour itself, with every technical statement preserved (decision-record references like ADR-x/DEC-x stay). Two runtime strings also dropped their ticket ids: the tools executor's approval-rewrite refusal message and the server's secret-resolution hint. A new `check-api-wording` gate scans the generated API reference and fails CI if ticket vocabulary ever leaks back in.

- Updated dependencies [[`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4)]:
  - @graphorin/core@0.13.1
  - @graphorin/observability@0.13.1

## 0.13.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.13.0
  - @graphorin/observability@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.1
  - @graphorin/observability@0.12.1

## 0.12.0

### Minor Changes

- [#195](https://github.com/o-stepper/graphorin/pull/195) [`9bc93fe`](https://github.com/o-stepper/graphorin/commit/9bc93fe6135fdda421219fb5558bf8eb486437f7) Thanks [@o-stepper](https://github.com/o-stepper)! - Durable suspended agent runs (migration 038): a run parked on durable HITL (`awaiting_approval`) now survives a server restart. The `RunStateTracker` mirrors every park into the new `store.suspendedRuns` sidecar (`suspended_runs` table, session-scoped for the erasure cascade), boot hydration re-registers persisted parks, and `POST /runs/:runId/resume` rehydrates them through the owning agent's new `serializeState` / `deserializeState` codec (version-stamped, binary-safe, secret-redacted - the `Agent` interface gains both methods). Rows are dropped when the run settles (resume completes/fails, or an explicit `POST /runs/:runId/abort`); the graceful-shutdown force-abort deliberately keeps them. Custom `ServerAgentLike` fixtures without the codec keep today's in-memory behaviour and the resume endpoint answers an actionable `409 run-state-unavailable`; an unreadable durable payload answers `500 run-state-invalid`.

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.12.0
  - @graphorin/observability@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [[`47b6034`](https://github.com/o-stepper/graphorin/commit/47b60342dc8a345d1299a22a2fc4fe2aac50bb31)]:
  - @graphorin/core@0.11.0
  - @graphorin/observability@0.11.0

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.10.2
  - @graphorin/observability@0.10.2

## 0.10.1

### Patch Changes

- [#184](https://github.com/o-stepper/graphorin/pull/184) [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix a working-block second mutation crashing under a partial (NULL) scope (e2e 2026-07-13, MEMORY-C-01, critical). A block written under a scope with a NULL session or agent id (for example the wave-D user-only profile block, scope `{ userId }`) could not be mutated a second time: the `(scope_user_id, scope_session_id, scope_agent_id, label)` UNIQUE index does not treat NULLs as equal, so the `ON CONFLICT` upsert never matched and the write collided on the PRIMARY KEY `id` with `UNIQUE constraint failed: working_blocks.id`. `WorkingMemoryStoreImpl.upsert` now resolves the existing row with the same NULL-safe `COALESCE` semantics the rest of the store already uses for reads/deletes, then updates it in place (preserving `id` and `created_at`, reviving a soft-deleted row) or inserts fresh. A regression test covers repeated upserts under both a user-only scope and a user+session scope.

- [#184](https://github.com/o-stepper/graphorin/pull/184) [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix session-tier reads ignoring `SessionScope.userId` (e2e 2026-07-13, SESSIONS-01, security). `SessionMemoryStore.list`, `listWithMetadata`, `count`, and `search` filtered on `scope_session_id` alone, so a caller who knew another user's session id could read that user's transcript. All four reads now also scope by `scope_user_id`, so a mismatched user sees nothing while the owner reads their own session unchanged. Regression test pins that a different user with the same session id gets zero rows.

- [#184](https://github.com/o-stepper/graphorin/pull/184) [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix session erasure crashing in the default vec0 mode (e2e 2026-07-16, STORE-SQ-02, critical). `deleteSession` / `pruneSessions` discovered per-embedder vec0 sidecars with a `LIKE 'episodes_vec_%'` scan over `sqlite_master`, which also matched a vec0 virtual table's SHADOW tables (`_info`, `_chunks`, `_rowids`, `_vector_chunks00`). Those shadow tables reject `DELETE` ("table ... may not be modified"), so the whole IMMEDIATE-transaction erasure cascade rolled back and nothing was deleted - the documented GDPR-style erasure path (guide/privacy.md, session-store RP-6) was broken for any session with embedded content in the default vector mode. `#contentVecTables` now filters to the addressable tables only (the vec0 main or a linear-fallback sidecar), mirroring `VectorTableManager`'s existing shadow-table filter. A new regression test exercises the real vec0 path (previous erasure tests ran with `skipSqliteVec: true`, so the shadow tables never existed).

- Updated dependencies [[`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051)]:
  - @graphorin/core@0.10.1
  - @graphorin/observability@0.10.1

## 0.10.0

### Minor Changes

- [#181](https://github.com/o-stepper/graphorin/pull/181) [`214c20f`](https://github.com/o-stepper/graphorin/commit/214c20f1b2dc7463b683a86f50bc6b10c11ca3f0) Thanks [@o-stepper](https://github.com/o-stepper)! - Actionable native-binding failure (external audit 2026-07-16, P1-3). pnpm 10+ skips dependency build scripts unless approved, so a consumer install can look successful while `better-sqlite3`'s prebuilt binary was never downloaded - the first database open then died with a raw `bindings.js` stack. Both driver loaders (default and the cipher peer) now detect that failure and throw the new typed `SqliteNativeBindingError` naming the actual fix: add `"pnpm": { "onlyBuiltDependencies": ["better-sqlite3", "sqlite-vec"] }` to the application package.json (or run `pnpm approve-builds`) and reinstall. The cipher path previously misreported this case as a missing peer. The installation guide gains a matching "Native modules and pnpm 10" section, and a new scheduled consumer-install smoke (`scripts/smoke-consumer.mjs`) replays the documented recipe against the published packages weekly.

### Patch Changes

- Updated dependencies []:
  - @graphorin/core@0.10.0
  - @graphorin/observability@0.10.0

## 0.9.0

### Minor Changes

- [#170](https://github.com/o-stepper/graphorin/pull/170) [`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e) Thanks [@o-stepper](https://github.com/o-stepper)! - Trigger consolidation on a settled segment (item 7, A2). New `buffer:N` consolidator trigger fires the light+standard chain when the unconsolidated transcript tail (from the standard-phase cursor) reaches N tokens - measured with the same chars/4 proxy over the same rendering as the W-081 transcript budget. The tail is evaluated on activity signals via the new `Consolidator.notifyActivity(scope?)`; the documented contract is "buffer:N OR idle:T", whichever comes first, with the existing trigger cooldown damping bursts. The server wires the signal automatically: the run tracker (the single choke point every REST/WS run passes) now emits activity events - every tracked run resets the triggers scheduler's idle window (`recordActivity()`, making `idle:T` a true debounce), and a settled run re-evaluates `buffer:N`. `RunStateTracker.setActivityListener` and the `buffer` trigger reason/spec are additive API.

- [#170](https://github.com/o-stepper/graphorin/pull/170) [`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e) Thanks [@o-stepper](https://github.com/o-stepper)! - Vector-index hygiene (item 10 steps 1-2). The index version key now records the write-path contextualization mode: `embedding_meta` gains an `index_mode` column (migration 033), `registerOrReturn` accepts `indexMode` and fails a mode switch exactly like a `configHash` change, while legacy rows adopt the current mode once instead of failing retroactively. `createMemory` computes the recipe from `contextualRetrieval` plus the consolidator's opt-in `llm` enrichment and gains `onIncompatibleEmbedder: 'fail' | 'fts-only'` - the `'fts-only'` mode degrades an incompatible embedder to keyword-only search (WARN + `x.memory.embedder-incompatible` span, vectors stay stale) instead of crash-looping an always-on assistant until `graphorin memory migrate` rebuilds the index.

- [#171](https://github.com/o-stepper/graphorin/pull/171) [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041) Thanks [@o-stepper](https://github.com/o-stepper)! - New package `@graphorin/channels` - the messenger front door (bot-adoption wave B, item 1). The vendor-neutral adapter SPI (`ChannelAdapter`, `InboundChannelMessage`, the `ChannelIdentity` triple, `ChannelCapabilities`, `DeliveryPayload` with the optional `question` HITL placeholder, typed fire-and-forget `ChannelDeliveryError`); a deterministic identity router (ordered route table, first-match-wins, mandatory catch-all, stable per-peer `defaultSessionKey`; sessionKey is a routing selector, never an authz token); the access policy (`pairing` default with one-time TTL codes and a per-channel pending cap, `allowlist`, `open`, `disabled`) over the new `PairingStore` contract in `@graphorin/core/contracts` (sqlite implementation behind migration 034, exposed as `createSqliteStore(...).pairing`); the gateway runtime (bounded per-adapter queues with shed-on-overflow, access check before any routing or model spend, inbound sanitisation + ready-made `inboundTaint` seed, reply/proactive delivery through the shared outbound catalogue with channel-default `'strip'`); and `@graphorin/channels/testkit` (loopback adapter, in-memory pairing store, framework-agnostic adapter conformance suite). Core also gains the canonical `SttAdapter` contract whose transcripts pin `trustClass: 'channel-inbound'`. The server hosts the gateway structurally (`createServer({ channels })`, new `@graphorin/server/channels` subpath): started last / stopped first in the lifecycle, aggregated into `/v1/health`, and bridged so accepted inbound messages call `scheduler.recordActivity()`. No vendor adapters ship with the framework.

- [#171](https://github.com/o-stepper/graphorin/pull/171) [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041) Thanks [@o-stepper](https://github.com/o-stepper)! - Memory writes strictly after guardrails (bot-adoption wave B, B3 / item 15). The run loop's commit gates stamp a per-turn verdict sidecar - `RunState.verdicts`, a plain JSON-safe object keyed `'<step>:<offset>'` with `RunTurnVerdict { guardrail?, lateralLeak?, dataflowFlags? }` - covering input-guardrail block/rewrite, lateral-leak blocks and assistant-output dataflow findings; widen-only merge, serialized through `SerializedRunState` with a defensive rebuild, wiped by compaction for the turns its splice summarized away, and surfaced directly as `AgentResult.verdicts`. Verdicts persist next to the message: `SessionMessagePushOptions.verdict` threads through core `SessionMemoryStore.push` (additive third argument), the memory session tier, `Session.push` and the sqlite store (`verdict_json` column, migration 035; malformed rows degrade to no verdict), and `SessionMessageRecord.verdict` exposes it on the consolidator read path. `createMemory({ ingestGate })` then filters the extraction batch deterministically on BOTH consolidator paths before noise filtering - the canonical `verdictIngestGate` excludes blocked and lateral-leak-withheld turns while rewritten turns pass with their rewritten text; the idempotency cursor still advances through excluded messages (a blocked turn can never wedge consolidation) and a throwing gate fails closed. This gate is the required precondition for the auto-promotion and proactive act-grant features of later waves.

- [#176](https://github.com/o-stepper/graphorin/pull/176) [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160) Thanks [@o-stepper](https://github.com/o-stepper)! - Operation-level memory eval metrics (wave-D D1, plan item 4). `@graphorin/evals` gains the HaluMem-format loader (`loadHaluMemDataset` / `parseHaluMem`, stage `'operations' | 'qa'`, user-supplied local JSON per DEC-154) over new type-only operation contracts (`MemoryGoldPoint`, `MemoryOperationsEvalInput`, `MemoryOperationsObservation`), plus the staged `scorers/memory` family: deterministic `memoryExtractionRecall` / `memoryExtractionPrecision` / `memoryUpdateOmission` (token-F1 matching with a proximity tie-break for update pairs; custom matchers supported) and the judged `memoryQaHallucination` (llmJudge-based, EB-7-hardened). The store side adds `SemanticMemoryStoreExt.listActive` (recall-eligible enumeration with optional `excludePendingSupersede`) - shared groundwork for the D2 projection and the new `benchmarks/halumem` suite, whose `--conflict-pipeline on|off` axis is the update-omission value proof for the conflict pipeline; the longmemeval runner gains the same switch (replacing the historic hardcoded `off`) plus a `--max-cost-usd` run-level ceiling composed from `withCostLimit` + `withCostTracking`.

- [#176](https://github.com/o-stepper/graphorin/pull/176) [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160) Thanks [@o-stepper](https://github.com/o-stepper)! - Pre-compaction flush, recall ledger, PromotionPolicy and auto-induction (wave-D D4, plan item 3). The context engine gains a `preCompactionHooks` seam (fired before the summarizer with the full buffer; side-effect only, failures fold into `hookFailures`) and the built-in `memoryFlushHook({ provider })` - one budgeted LLM call salvages durable facts from content about to be summarized away, passes candidates through the B3 ingest gate when configured, and writes them QUARANTINED; `SessionMemory.flushImportant` is deprecated in its favour. Migration 036 adds the recall ledger (`fact_recall_queries`: DISTINCT queries per fact by normalized-query hash, fed from the semantic search path, erased with its fact). The deterministic `PromotionPolicy` (`consolidator.promotion: { minSalience?, minRecalls?, minUniqueQueries?, minAgeMs?, allowedProvenance?, maxPerRun? }`) promotes quarantined facts whose recall evidence clears every threshold through the audited `validate` path (injection-flagged refused, pending W-019 supersedes completed; `PhaseOutcome.factsPromoted`). Fail-closed gates: `promotion` or `autoPromoteExtraction: true` without `ingestGate` now throws `IngestGateRequiredError`, and the W-083 guard forces autoPromote update/conflict decisions against QUARANTINED or USER-provenance targets onto the pending-supersede path. On the agent, `createAgent({ procedureInduction: { auto, minSteps?, minToolCalls?, minCostUsd? } })` distils COMPLETED runs above the thresholds via `memory.procedural.induceFromRun` (result stays quarantined; failures WARN once and never fail the run). SpanType gains `memory.consolidate.promotion`.

- [#176](https://github.com/o-stepper/graphorin/pull/176) [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160) Thanks [@o-stepper](https://github.com/o-stepper)! - Resumable embedder migration, real CLI migrate, KNN fallback and space reclaim (wave-D D5, plan item 10 steps 3-4; MST-12 and N-2 closed). The dead `migration_state` table is revived as a persisted cross-process cursor (`store.embedderMigration.state`); `migrateEmbedder({ state })` records progress after every batch and RESUMES from the cursor on the next invocation - kills and explicit aborts both stay resumable. The store now ships the `nextBatch` pager the runner always lacked (`store.embedderMigration.nextBatch`: pages live facts/episodes, re-embeds into the target sidecar, deletes the source row, flips `embedder_id`). `graphorin memory migrate --from --to --strategy --embedders <module>` is real (local factory-module import per DEC-154, `--batch-size`, `--json`), and `--reclaim` drops retired embedders' vector sidecar tables + runs `PRAGMA incremental_vacuum` (`store.embedderMigration.dropRetiredVectorTables()`). `SqliteVecMissingError` softens into policy: `createSqliteStore({ onMissingSqliteVec: 'linear-fallback' })` serves vectors from plain sidecar tables with a batched in-process cosine KNN (`setImmediate` yields, vec0 top-k parity pinned by test); a database stays in ONE mode, guarded both ways with actionable errors. The storage guide gains the migration/reclaim runbook and a `memory migrate` row in the live-server concurrency matrix.

- [#176](https://github.com/o-stepper/graphorin/pull/176) [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160) Thanks [@o-stepper](https://github.com/o-stepper)! - Profile projection (wave-D D2, plan item 6). `createMemory({ profile: { topics?, maxSlots?, maxChars?, scope? } })` adds a deep-phase pass that projects ACTIVE facts (never quarantined, never W-019 pending-supersede - sourced via the new `listActive({ excludePendingSupersede: true })`) into the reserved `profile` working block as deterministic topic / sub-topic / content slots with fact-id provenance; hallucinated provenance references and out-of-taxonomy topics are dropped. The block is registered `readOnly: true` (agent `block_*` tools refuse writes - the consolidator is the single writer) and written USER-scoped by default: session deletion deliberately does not erase it, and the erasure path is the new hard-delete surface `memory.working.purge(userScope, 'profile')` (`WorkingMemoryStore.purge?` optional-additive on the core contract; `forget()` remains a soft tombstone). `PhaseOutcome.profileProjectionUpdated` reports rewrites; configuring `profile` without an enabled consolidator WARNs once. SpanType gains `memory.consolidate.profile-projection`.

### Patch Changes

- Updated dependencies [[`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f)]:
  - @graphorin/core@0.9.0
  - @graphorin/observability@0.9.0

## 0.8.0

### Patch Changes

- [#166](https://github.com/o-stepper/graphorin/pull/166) [`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix the stale `searchVector` doc comment (part of E-01, N-01/21): the fact KNN search documented its `score` as `1 - distance` (raw cosine similarity), but since CS-3 it is populated via `scoreFromDistance`, a normalized `[0, 1]` similarity (`(1 + cos) / 2` for the cosine metric). Doc-only change, no runtime behavior change.

- Updated dependencies [[`d6a0414`](https://github.com/o-stepper/graphorin/commit/d6a041402fa33d7695379c7536ed2311a7c0fd5b)]:
  - @graphorin/observability@0.8.0
  - @graphorin/core@0.8.0

## 0.7.0

### Minor Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-110: both audit.db open paths now apply the CS-7 cipher-selection pragmas before `PRAGMA key`, so `config.audit.cipher` actually selects the cipher (it was silently ignored - every audit.db came out as the sqlite3mc default, and tools opening it with the declared `sqlcipher` failed with SQLITE_NOTADB). The audit default is pinned to `chacha20` (NOT the main store's `sqlcipher`): pre-fix audit files were created without cipher pragmas, i.e. in chacha20 format, so the pin stays byte-compatible with every existing file. Unknown cipher values fail fast. UPGRADE NOTE: a deployment whose config has long carried `audit.cipher: 'sqlcipher'` (previously ignored) will now fail to open its existing chacha20 file - remove the setting or re-encrypt the audit database. `cipherSelectionPragmas` is now exported from `@graphorin/store-sqlite`.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-005: HITL/workflow checkpoints are linked to their session and erased by the session hard-delete cascade.

  HITL suspends persist the FULL serialized conversation (`RunState`) into `workflow_checkpoints`; previously nothing connected those rows to a session, so `DELETE /v1/sessions/:id` left the entire transcript recoverable forever. Now: `CheckpointMetadata` gains an optional `sessionId` (additive); migration 029 adds a `session_id` column + index to `workflow_checkpoints` and backfills historical `namespace='agent'` rows from the state blob; the agent runtime stamps `sessionId` on all three suspend write sites (step suspend, resume write-ahead intent, post-dispatch journal); and `deleteSession`/`pruneSessions` collect thread ids from BOTH `session_workflow_runs` and the new column, erasing `workflow_checkpoints` + `workflow_pending_writes` before dropping the mapping. Deleting a session now removes its suspended-run snapshots - time-travel/forensics for a deleted session is intentionally gone (that is what hard-delete means).

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-009: checkpoint GC primitives - `CheckpointStoreExt` with `pruneThreads` and `compactThread`.

  The engine writes a full state snapshot per execution step and nothing ever deleted them (`deleteThread` had zero production callers). `@graphorin/core` adds the additive `CheckpointStoreExt` contract: `pruneThreads({beforeEpochMs, onlyTerminal})` - a namespace-SCOPED retention sweep whose policy reads each pair's LATEST checkpoint (suspended threads with live HITL approvals/awakeables survive by default) - and `compactThread(threadId, namespace, keepLast)` for in-place history compaction (resume reads the latest tuple, so `keepLast >= 1` never breaks resumability). Implemented by `SqliteCheckpointStore` (per-pair transactions, never via the namespace-blind `deleteThread` - a reused threadId across workflows must not lose another workflow's suspended state) and by `InMemoryCheckpointStore`. `GraphorinSqliteStore.checkpoints` is now typed `CheckpointStoreExt`. `documentation/guide/workflow-engine.md` gains a "Retention and cleanup" section with the growth arithmetic and the deleteThread caveat.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-072: every export map's `import` condition becomes `default`, and the Node floor rises to `>=22.12.0`.

  CJS consumers previously hit a bewildering `ERR_PACKAGE_PATH_NOT_EXPORTED` instead of a clear ESM-only signal. With the `default` condition, plain `require('@graphorin/core')` works via Node's stable `require(esm)` - which shipped in 22.12, hence the engines bump across every workspace manifest (packages, examples, benchmarks, docs; enforced by the widened mvp-readiness sweep). No dual-instance hazard: there is no CJS build, `require()` returns the same ESM module instance. ESM consumers are unaffected (`default` serves both paths; `types` stays first). The pack gate now runs attw under the full `node16` profile (was `esm-only`) and adds a runtime `require(esm)` smoke against the packed tarballs. Installs on Node 22.0-22.11 with `engine-strict` will refuse - upgrade Node (see the migration guide).

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-068: migration-runner TOCTOU fence + read-only CLI commands stop auto-migrating live databases.

  `runMigrations` re-checks `schema_migrations` INSIDE each per-migration IMMEDIATE transaction: when two processes race to migrate one file, the loser now skips (no-op) instead of crashing on non-idempotent SQL ("duplicate column name"). New read-only `pendingMigrations(conn)` helper reads `sqlite_master` first, so probing a foreign database never marks it by creating the bookkeeping table. The CLI store context gains `migrationPolicy: 'apply' | 'check'`; read-only commands (`memory inspect`/`activity`, `traces status|prune`, `triggers list`, `consolidator status`/`dlq-list`) now run with `'check'`: a newer CLI pointed at a running (older) server's database refuses with "schema is N migration(s) behind ... run 'graphorin migrate' (with the server stopped) or use a CLI version matching the server" instead of silently upgrading the schema under the live process. BEHAVIOR CHANGE: those commands now also refuse on a never-migrated database instead of creating the schema as a side effect.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-029/W-060: schema-driven session-content erasure via the exported `SESSION_SCOPED_PURGES` registry + a completeness gate test.

  `deleteSession`/`pruneSessions` previously purged only `session_messages` and `episodes`; consolidator-distilled facts (with their FTS/vec rows and entity links), insights, rules, working blocks, spans, consolidator state/runs and `memory_history` values all survived a hard-delete and stayed findable through semantic search. The purge is now a loop over a declarative registry (`SESSION_SCOPED_PURGES`, each entry naming the session column, FTS shadow, vec0 sidecar family, FK-referencing tables and memory-history scrub policy), with `SESSION_TABLE_EXEMPTIONS` documenting the tables the cascade handles directly. A schema-introspection gate test diffs the registry against every live table carrying `scope_session_id`/`session_id` - adding a new session-scoped table without an erasure decision fails the suite. Only rows scoped to the deleted session are removed; user-level rows (`scope_session_id IS NULL`) are untouched. BEHAVIOR CHANGE: session-scoped facts and insights no longer survive session deletion.

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-065: lifecycle owners for four small tables. `SqliteConsolidatorStateStore` gains `pruneRuns(beforeEpochMs)` (terminal per-tick run-log rows; `status='running'` always survives) and `pruneExhaustedBatches(beforeEpochMs)` (DLQ batches parked forever with `next_retry_at IS NULL`; batches awaiting retry stay claimable). New CLI `graphorin consolidator dlq-list` / `dlq-clear` (`--exhausted-only` default true, `--before`, `--id`, `--user`) make the permanent `dead-letter queue: N` status warning actionable - operator-level, cross-user, in the same style as the existing `dlqSize` counter. `IdempotencyStore.prune`'s TSDoc now names its production caller (the server's hourly sweep). Migration 031 drops the dead `trigger_fire_log` table (created by 007, never written or read by any code; append-only discipline preserved - 007 untouched).

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-006/W-008: span retention primitives. New exported `deleteSpansForSession(conn, sessionId)` and `pruneSpans(conn, {beforeEpochMs})` (deletes spans that FINISHED before the cutoff, epoch-ms in, ns conversion inside; covers `session_id IS NULL` rows whose only deletion path is age). Migration 030 adds the `idx_spans_end` index so the sweep is not a full table scan. Session hard-delete already cascades into `spans` via the `SESSION_SCOPED_PURGES` registry - `session.replay()` for a deleted session no longer reconstructs the run, which is the point of hard-delete. `documentation/guide/observability.md` now tells the real retention story (`graphorin traces prune` / `pruneSpans`) instead of claiming a nonexistent "configured retention window".

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - Typed lock contention (W-067): raw driver `SQLITE_BUSY` / `SQLITE_BUSY_SNAPSHOT` errors from the connection adapter's `run`/`get`/`all`/`exec`/`execMany`/`transaction` now surface as the new `SqliteBusyError` - stable `name`, `code: 'SQLITE_BUSY'` (compatible with callers branching on the driver's `err.code`), `kind: 'sqlite-busy'`, the driver error as `cause`, and a message that actually says what happened: another process holds the write lock (a running server next to a CLI command), the busy handler already waited `busy_timeout`. `prepare()` stays the documented raw escape hatch. The timeout is now configurable: `OpenConnectionOptions.busyTimeoutMs` / `CreateSqliteStoreOptions.busyTimeoutMs` (default 5000, applied after the hardening pragmas - the exported `WAL_HARDENING_PRAGMAS` constant is unchanged, and the override also applies on the `disableWalHardening` branch). No auto-retry by design. The CLI's top-level error path prints the explanatory message instead of a bare "database is locked".

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - Durable timers now fire without user polling code (W-032). The engine stamps `CheckpointMetadata.wakeAt` (earliest due frontier timer) on suspended checkpoints; `CheckpointStore` gains the optional `listSuspended(namespace, { dueBefore, limit })` enumeration (implemented by the SQLite adapter - migration 032 adds `workflow_checkpoints.wake_at` with a partial index - and by `InMemoryCheckpointStore`); the new `createTimerDriver({ workflows: [{ workflow, checkpointStore }] })` polls due threads and calls `workflow.tick`, re-arming at `min(pollIntervalMs, earliest nextWakeAt)`, with per-thread error isolation and benign handling of cross-process `checkpoint-version-conflict` races. On the server, `createServer({ workflowTimers: { driver } })` binds a lifecycle daemon and reports `checks.workflowTimers` on `/v1/health`. A custom store without `listSuspended` fails fast with `TimerDriverStoreUnsupportedError`. Threads suspended before migration 032 carry no `wake_at` and stay invisible to the driver until one manual `tick` or resume re-persists them.

- [#158](https://github.com/o-stepper/graphorin/pull/158) [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab) Thanks [@o-stepper](https://github.com/o-stepper)! - Database-file compaction path (W-064). `openConnection` now declares `PRAGMA auto_vacuum = INCREMENTAL` on every database it CREATES (checked via `page_count == 0`, right after the cipher pragmas, so encrypted databases opened through the `store-sqlite-encrypted` delegate get it automatically; pre-existing databases are untouched - the pragma is a spec-guaranteed no-op there). New `graphorin storage compact` command: `wal_checkpoint(TRUNCATE)` + batched `PRAGMA incremental_vacuum` (`--batch-pages`, default 1000, keeps writer locks short) + a final checkpoint, reporting freelist before/after and reclaimed bytes. Unlike the forbidden `VACUUM`, incremental vacuum relocates free pages through the pointer map without renumbering implicit rowids, so FTS5 external-content mappings survive - covered by an integrity + search test. On a database created before this version (`auto_vacuum=0`) the command reports the high-water-mark limitation honestly and exits 0 without modifying the file; reclaiming disk there requires recreating the store. Docs: storage guide danger-block extended with the incremental-vacuum contrast, cli + deployment guides gain the command.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Store mutation paths gain scope-guarded variants, symmetric with the read-side isolation (W-154): every read binds `scope_user_id`, but `forget`, `setStatus` (facts/episodes/rules/insights), `archive`, `archiveFact`, `purge`, and `markAccessed` operated on the bare id - code holding a leaked or cross-user id could quarantine, archive, or hard-purge another user's memory. All mutators now accept an optional trailing `scope?: SessionScope` (additive; existing adapter implementations stay structurally compatible): when supplied, a non-owned row is a deterministic silent no-op - a scoped `purge` of a foreign id writes nothing at all, not even the PURGE audit row. The `@graphorin/memory` tiers pass their scope through on `validate`/`forget`/`purge`/`archive` and the recall `markAccessed` path; the consolidator and erasure cascades deliberately keep calling unscoped.

### Patch Changes

- [#154](https://github.com/o-stepper/graphorin/pull/154) [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04) Thanks [@o-stepper](https://github.com/o-stepper)! - W-019: supersede defers the old fact's interval closure until the quarantined successor is validated.

  Previously a reconcile 'update'/'conflict' closed the ACTIVE fact's validity interval immediately while the extraction-provenance successor landed quarantined - default recall then returned NOTHING for that knowledge until (if ever) a manual `fact_validate`. Now: when the successor is quarantined, `SemanticMemory.supersede` records the link (`supersedes` on the successor, no schema change) and leaves the old fact recall-visible; `validate()` completes the closure on promotion (idempotent via the store's COALESCE upsert). `supersede` gains an `options.autoPromoteSynthesized` parameter and the standard phase threads `autoPromoteExtraction` through the update/conflict routes (the documented contract of the flag - previously only 'add' honoured it), restoring immediate closure for injection-clean successors when opted in. The deep phase links a quarantined judge-winner via the new optional `SemanticMemoryStoreExt.linkPendingSupersede` (implemented by store-sqlite) instead of closing the interval. Security posture unchanged: auto-activating successors would hand a MINJA attacker instant active memory, so old-visible-until-validated is the chosen trade-off. BEHAVIOR CHANGE: until validation, recall returns the OLD fact (previously: nothing).

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - Reachable retention lever for `memory_history` (W-066):

  - `@graphorin/core`: new `MemoryStoreExt` contract (`extends MemoryStore` with `pruneHistory(olderThanMs)`), mirroring the `SessionStoreExt` precedent - strictly additive, custom `MemoryStore` implementations keep compiling. The TSDoc pins the unit semantics: the argument is an AGE in milliseconds, never an epoch cutoff.
  - `@graphorin/store-sqlite`: `SqliteMemoryStore` declares `implements MemoryStoreExt` and `GraphorinSqliteStore.memory` is now typed `MemoryStoreExt`, so `pruneHistory` is reachable without casts.
  - `@graphorin/cli`: new `graphorin memory prune-history --older-than <duration|date>` command. `--older-than` is mandatory (destructive by design, no default), takes a duration (`30d`, `12h`) or a PAST ISO date (converted to `now - date`; future dates are refused - they would prune the whole table). Documented in the CLI guide and the memory-system guide: history grows by design, `purge()` already scrubs sensitive text, pruning is storage-cost hygiene.

- [#153](https://github.com/o-stepper/graphorin/pull/153) [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534) Thanks [@o-stepper](https://github.com/o-stepper)! - CS-10 guard completeness (W-113): `rules_fts` (added by migration 028) is now covered by the FTS-to-rowid integrity check - previously the newest FTS index escaped the orphan-row scan entirely. A coverage self-check test enumerates the `%_fts` virtual tables of a fully-migrated database against the registered pairs, so a future FTS index missing from `FTS_PAIRS` fails the suite instead of silently escaping the guard (`listCheckedFtsTables` is exported `@internal` for that test).

- [#160](https://github.com/o-stepper/graphorin/pull/160) [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156) Thanks [@o-stepper](https://github.com/o-stepper)! - W-111: migration 022 (session sequence unique index) now runs a data-repair preflight, so databases that actually hit the MAX+1 sequence race it fixes can upgrade instead of failing to start. The `Migration` contract gains an optional `preflight(conn)` hook that the runner invokes inside the migration's own transaction, immediately before its SQL, and only when the version is pending - the SQL file stays byte-identical, so the checksum tamper-guard keeps holding for already-migrated databases. The 022 preflight deterministically renumbers `session_messages.sequence` only inside sessions that contain duplicate `(scope_session_id, sequence)` pairs, preserving relative order via `ROW_NUMBER() OVER (PARTITION BY scope_session_id ORDER BY sequence, created_at, rowid)`; sessions without duplicates keep their sequence values byte-for-byte, and row ids/message ids are untouched. `runMigrations` also accepts an internal, test-only `{ upTo }` option used to freeze a database at a historical schema and exercise the upgrade path.

- [#162](https://github.com/o-stepper/graphorin/pull/162) [`73b19ca`](https://github.com/o-stepper/graphorin/commit/73b19caeda388bda628a48138cb7d70b1db839a3) Thanks [@o-stepper](https://github.com/o-stepper)! - The README no longer describes a WorkerPool server mode that does not exist: `CreateSqliteStoreOptions` has no `workerPool` field and there is no 1-writer/N-reader wrapper in the package. The server-mode section now documents the real difference - `mode: 'server'` auto-starts the periodic `PRAGMA wal_checkpoint(RESTART)` timer (`walCheckpointIntervalMs`, default 5 minutes) while `'lib'` starts it only when the interval is set - with a type-correct example and a link to the new per-command concurrency matrix in the storage guide.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - TSDoc `{@link}` hygiene sweep (W-130): all 55 broken links found by TypeDoc's now-enabled `validation.invalidLink` are fixed - two resolved to their real targets (`GraphorinMCPError` was misnamed `MCPError`), the rest (cross-package, `import()`-form, unexported-constant, and DOM-type references that have never rendered as hrefs) converted to plain inline code. The docs build now fails on any new broken `{@link}` via a scoped gate.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - `TriggerStore.recordFire` now carries a monotonic wall-clock fence (W-133): a fixation whose `firedAt` is not strictly later than the stored `last_fired_at` is a no-op, so a second (unsupported) scheduler process re-fixing an old fire cannot rewind `next_fire_at`/`missed_fires`. Supported single-process behaviour is unchanged. `claimReadyBatches` is documented as a plain non-claiming SELECT whose concurrent-drain serialization belongs to the CS-8 consolidator scope lock (the name stays: it sits on the stable contract surface).

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Tarballs now ship `src/` so the published `dist/**/*.d.ts.map` files actually work (W-136): the maps referenced `../src/*.ts` that the `files` whitelist excluded, so go-to-definition fell back into `.d.ts` and the shipped maps were dead weight. The pack gate gains a `map-integrity` leg: every source referenced by a shipped map must resolve inside the tarball (or be embedded via `sourcesContent`), with an anti-vacuous guard - a package whose tsdown config emits declaration maps must contain a non-zero number of `.d.ts.map` files, so a cache-restored dist that silently dropped maps fails the gate instead of passing vacuously. `mvp-readiness` now requires `src` in every publishable `files` array.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Every published package now declares its tree-shaking contract via `sideEffects` (W-137): 18 packages audited to a pure module scope get `false`, the CLI declares its bin entry (`["./dist/bin/*"]`), and `@graphorin/security` gets an explicit `true` - its secrets subsystem registers built-in resolvers and the SecretValue caller-context provider at import time, so marking it pure would let bundlers drop those registrations. `mvp-readiness` now fails any publishable manifest without a declared `sideEffects`, closing the drift for future packages.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - Embedding vectors that are `Float32Array` VIEWS into a larger buffer (the standard subarray idiom of batched embedders) now serialize correctly on all four write/search paths of facts and episodes (W-153): the raw `Buffer.from(vec.buffer)` calls ignored `byteOffset`/`byteLength` and serialized the whole underlying buffer, passing the `vector.length` dim check and surfacing later as an opaque vec0 dimension error. All sites now use the existing `f32ToBlob` helper (already used for entity embeddings). Shipped embedders `.slice()` before storing, so their behaviour is byte-identical.

- [#164](https://github.com/o-stepper/graphorin/pull/164) [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00) Thanks [@o-stepper](https://github.com/o-stepper)! - `EpisodicMemoryStore.count()` now applies the `archived = 0` filter its own contract promises (W-155): the doc comment says "same default filters as the FTS search", but archived episodes - excluded from FTS and vector recall since CS-2 - still inflated the count. The visible effect was the "Episodes: N" line of the memory-metadata prompt block (CE-5) drifting above what recall could reach after any `EpisodicMemory.archive()`. Facts-side `count()` already filtered archived rows.

- Updated dependencies [[`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`832f22e`](https://github.com/o-stepper/graphorin/commit/832f22e570b8c3175c1adeb4c150070cbd131534), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`4ee256e`](https://github.com/o-stepper/graphorin/commit/4ee256e30fe9190cef6c48dc6785464757707156), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`32bbd03`](https://github.com/o-stepper/graphorin/commit/32bbd03b588136a355e4b5ad6ac5e19b36b4d8ab), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`764239b`](https://github.com/o-stepper/graphorin/commit/764239b97e0e0202442e91272583f13adeb12d00), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04), [`fe98522`](https://github.com/o-stepper/graphorin/commit/fe98522ce2477c9a7dc09029f9dcfdb1f7c9aa04)]:
  - @graphorin/core@0.7.0
  - @graphorin/observability@0.7.0

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`826ee59`](https://github.com/o-stepper/graphorin/commit/826ee5933ad38693b0dd2f20a110abfecba7d23d), [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/observability@0.6.1
  - @graphorin/core@0.6.1

## 0.6.0

### Minor Changes

- [#137](https://github.com/o-stepper/graphorin/pull/137) [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627) Thanks [@o-stepper](https://github.com/o-stepper)! - Durable workflow orchestration (audit 2026-07-04 Wave D, cluster D1) - promotes the workflow engine to step-checkpoint durable execution and closes the confirmed `workflow-01..14` correctness floor.

  - Feature floor: atomic checkpoint compare-and-set (`CheckpointStore.put({ expectedLatestId })` + `CheckpointConflictError`, honoured by both bundled stores), planned-order channel writes, merge-failure + boundary-abort + max-steps terminal checkpointing, all-false-`__start__` dead-end, ephemeral-value observability on `workflow.channel.update`, satisfied-pause retention on sibling failure, `maxConcurrentTasks` bounded task pool, `Dispatch` cross-realm brand, and hygiene (dead `visitedNodes`, six->seven stream modes, `'async'` source removed, resume durability override).
  - New durable capabilities: per-node `timeoutMs` + `retry` (`nodeDefaults`), durable timers (`sleepUntil`/`sleepFor` + `workflow.tick`), durable promises (`awaitExternal` + `resolveAwakeable`), persisted approvals (`requestApproval` + `approve`), `WorkflowConfig.version` pinning (`workflow-version-mismatch`) + journal-divergence detection, and opt-in step journaling (`journalSteps`) with crash-recovery that replays completed tasks and re-runs only unfinished work.

- [#137](https://github.com/o-stepper/graphorin/pull/137) [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627) Thanks [@o-stepper](https://github.com/o-stepper)! - Memory architecture evolution (audit 2026-07-04 Wave D, cluster D3) - opt-in; defaults byte-identical.

  - Learned-context digest block (Letta sleep-time): a deep-phase pass rewrites the reserved `learned_context` working block from recent evidence via one budgeted LLM call (`consolidator.learnedContext`, off at every tier).
  - Principal/owner dimension (`MemoryOwner` on facts/episodes/rules/insights, migration 026) stamped `'agent'` on synthesized writes, with a retrieval-time `owner` filter (`FactSearchOptions.owner`); default reads apply no filter.
  - Retrieval-frequency reinforcement: `facts.access_count` (migration 027) + opt-in `SalienceWeights.accessReinforcement` (default 0 = inert).
  - Runbook memory: `rules_fts` (migration 028) + `ProceduralMemory.search` returns whole validated procedures, with a gated `runbook_search` tool (`createMemory({ runbookSearch: true })`).

- [#137](https://github.com/o-stepper/graphorin/pull/137) [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627) Thanks [@o-stepper](https://github.com/o-stepper)! - Retrieval SOTA graph wins (audit 2026-07-04 Wave D, cluster D5) - offline, opt-in; the billed/migration-heavy legs stay eval-gated.

  - PPR-lite graded expansion (HippoRAG-style damped spreading activation): `SqliteGraphStore.expandActivation` + `FactSearchOptions.expandHops: 0|1|2` + `graphScoring: 'ppr'` score neighbours by `damping^hopDepth` instead of a flat 1.
  - Graph + entity as first-class tunable fusion weights (`FusionWeights.graph` / `.entity`, were hardcoded neutral).
  - Exact entity-match retriever: `SqliteGraphStore.factsForEntityName` + `FactSearchOptions.entityMatch` add a precise "facts about <entity>" candidate leg.
  - `longmemeval` harness gains `--retrieval ppr` / `--retrieval entity`. Bitemporal event time, Matryoshka truncation, and cascade LLM reranking remain eval-gated.

### Patch Changes

- [#134](https://github.com/o-stepper/graphorin/pull/134) [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6) Thanks [@o-stepper](https://github.com/o-stepper)! - Session hard-delete and the RP-6 retention sweep now purge the session's CONTENT (store-01): `session_messages` rows plus their FTS and per-embedder vector index entries, and episodes scoped to the session, all inside the existing cascade transaction. Previously no code path anywhere deleted `session_messages`, so a "deleted" conversation stayed permanently searchable via `memory.session.list/search` - a GDPR hazard for a privacy-positioned framework. The core `SessionStoreExt.deleteSession` contract is updated to document the content cascade.

- [#135](https://github.com/o-stepper/graphorin/pull/135) [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3) Thanks [@o-stepper](https://github.com/o-stepper)! - Retrieval and consolidation now honour the trust contracts they document (audit 2026-07-04 Wave B, cluster B3).

  - memory-retrieval-01: default fact reads (FTS / vector / graph) behave as `asOf = now`, so superseded and validity-expired facts no longer surface as current - exactly what the `fact_supersede` tool promises. New `includeSuperseded: true` escape hatch (core `MemorySearchOptions`, memory `FactSearchOptions`, graph expand options) restores the full history for inspector / audit paths; `fact_search` and `deep_recall` outputs expose `validTo` / `supersededBy`.
  - memory-retrieval-02: `deep_recall` passes `forceHard: true` (choosing the tool IS the hardness signal; the local heuristic gate rejected the tool's own documented examples and is English-only). Iterative results carry a new `graded` flag so ungraded single-shot passes stop claiming sufficiency as a verdict.
  - memory-retrieval-03: a tagged search widens the fusion pool the same way decay does - the record-level tags filter runs after the topK cut, so tagged searches no longer silently return fewer than topK hits.
  - memory-consolidation-01: the deep-phase dedup verdict now soft-forgets (replayable tombstone) instead of preferring the GDPR hard-delete `purge`, and a vanished conflicting fact skips the judge entirely (admit, no provider call) - a model verdict can no longer hard-delete the only surviving copy.
  - memory-consolidation-07: the standard phase gains an embedder-independent exact-text duplicate guard (FTS + string equality, quarantine-aware), so replaying a partially-committed slice (DLQ / cursor retry) without an embedder no longer duplicates already-committed facts.

- [#135](https://github.com/o-stepper/graphorin/pull/135) [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3) Thanks [@o-stepper](https://github.com/o-stepper)! - Store durability and data lifecycle (audit 2026-07-04 Wave B, cluster B7).

  - store-02: new `graphorin storage backup <dest>` - online, consistent copy via the driver's page-level `backup()` API (safe under a live writer, preserves rowids so FTS5 mappings survive, encrypted stores produce an equally-encrypted copy). `deployment.md` stops recommending the non-existent `BACKUP TO` and explicitly warns against `VACUUM INTO`.
  - store-03: episode vector KNN gains the MRET-9 over-fetch loop facts already had (shared `widenKnn` helper) - a minority user's episodic recall is no longer starved to zero by a dominant user's vectors.
  - store-04: GDPR `purge()` scrubs the fact's text out of `memory_history` (both rows keyed to the id and value-matching rows - a SUPERSEDE row carries the new fact's text on the OLD id) inside the same transaction, keeping the event skeleton; new `SqliteMemoryStore.pruneHistory(olderThanMs)` retention API bounds the otherwise-unbounded table.
  - store-05: `encryptDatabase` copies via the driver's online backup API instead of checkpoint-close-then-copyFileSync - a concurrent writer can no longer commit WAL frames that silently miss the encrypted copy.
  - store-06: every write transaction now BEGINs IMMEDIATE, eliminating the SQLITE_BUSY_SNAPSHOT class on read-then-write transactions under server+CLI concurrency (busy_timeout waits instead).
  - store-07: `upsertState` builds its UPDATE from the supplied patch keys only (insert-if-absent + patch, in one immediate transaction) and `releaseLock` is a single conditional UPDATE - a concurrently acquired consolidator lock can no longer be silently reverted.
  - store-13: migration 025 adds partial indexes on `facts.supersedes` / `facts.superseded_by`, so `historyOf` chain walks stop scanning the user's facts per node; registry owner map backfilled for 024/025.
  - store F13: `distanceMetric: 'dot'` is coerced to `'cosine'` at registration with a loud warning (the vec0 table never computed dot; the meta now matches reality).

- [#138](https://github.com/o-stepper/graphorin/pull/138) [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a) Thanks [@o-stepper](https://github.com/o-stepper)! - Documentation-truth sweep (audit 2026-07-04 Wave E, cluster E10): stale npm package descriptions rewritten (cli "Phase 14a three commands", mcp "upcoming auth CLI", store-sqlite's nonexistent WorkerPool), the store-sqlite WorkerPool TSDoc and the cipher-pragma ordering comment corrected, the executor timeout-precedence JSDoc fixed to the real `inlineToolTimeoutMs > tier timeoutMs > default` order, the `rrf.<label>` explain signals documented, and the skills spec-snapshot wording no longer claims a CI cron refreshes it (the diff is a manual `--upstream` pass; the release gate only parses the bundled snapshot).

- [#138](https://github.com/o-stepper/graphorin/pull/138) [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix a catastrophic query-plan instability in the entity-graph expansion CTEs (found by the new `benchmarks/scale` probe, audit 2026-07-04 Wave E, cluster E7). In `expandOneHop` and `expandActivation` the planner could demote the recursive self-reference `walk` to the INNERMOST join loop (it can only ever be scanned), turning one hop-1 expansion into facts-scan x fact_entities-scan x walk-queue-scan - measured at 23.5 seconds for a single query over a 300-fact corpus with hub entities. The recursive step now uses `CROSS JOIN` to pin the join order at `walk -> facts(PK) -> fact_entities -> entities -> fact_entities`; the same query runs in ~10ms, and graph-expanded search (`expandHops`, `graphScoring: 'ppr'`) at 2k facts drops from tens of seconds per query to a ~53ms p95.

- Updated dependencies [[`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a)]:
  - @graphorin/core@0.6.0
  - @graphorin/observability@0.6.0

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

### Minor Changes

- Initial release. Default SQLite-backed persistence for the Graphorin
  framework - implements every storage contract from `@graphorin/core`
  on top of `better-sqlite3` with WAL hardening, an atomic migration
  runner, multi-table per-embedder vec0 vector layout, multilingual
  FTS5, and an encryption-or-fail-fast hook for the optional
  `@graphorin/store-sqlite-encrypted` cipher subpackage.
