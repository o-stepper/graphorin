# @graphorin/store-sqlite

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
