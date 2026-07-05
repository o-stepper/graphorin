# @graphorin/memory

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`826ee59`](https://github.com/o-stepper/graphorin/commit/826ee5933ad38693b0dd2f20a110abfecba7d23d), [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/observability@0.6.1
  - @graphorin/core@0.6.1
  - @graphorin/security@0.6.1
  - @graphorin/tools@0.6.1

## 0.6.0

### Minor Changes

- [#136](https://github.com/o-stepper/graphorin/pull/136) [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84) Thanks [@o-stepper](https://github.com/o-stepper)! - Context-engineering adoptions (audit 2026-07-04 Wave C, cluster C4).

  - Compaction failure hardening: one retry with backoff on summarizer failure; an auto-trigger pass that does not shrink the buffer FAILS (compression-loop class); after 3 consecutive failures the auto trigger disables itself until a later successful pass re-arms it.
  - Recent user messages survive compaction verbatim (`preserveUserMessages`, default 2) - only assistant/tool content is summarized away.
  - Summary prompt upgrades: handoff-to-another-LLM framing, quote-identifiers-VERBATIM rule, new "Constraints and non-negotiables" section (12 sections, v1.3); template id renamed to `summary-sections` (context-engine-14).
  - Clearing-tier parity with `clear_tool_uses_20250919`: `clearToolInputs` blanks paired assistant tool-call args; `readResultToolName: null` keeps the externalized-handle placeholder honest when `read_result` is not registered (context-engine-11).
  - New `reanchorRecentResults` post-compaction hook (+ `ctx.droppedMessages` on the hook context): re-injects the result handles a compaction just dropped, with bounded previews via an optional `readPreview` resolver.

- [#136](https://github.com/o-stepper/graphorin/pull/136) [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84) Thanks [@o-stepper](https://github.com/o-stepper)! - Retrieval trust and quality (audit 2026-07-04 Wave C, cluster C5).

  - Trust-aware retrieval ranking (MINJA defense): search multiplies each fused score by a rank-time trust factor reusing the eviction path's `SalienceWeights` - quarantined-but-included rows x0.3, foreign provenance (tool/imported/reflection/induction) x0.8, first-party UNTOUCHED. Surfaced as the `trust` signal on hits / `explainRecall`; per-call `trustWeighting: 'off'` escape hatch; weights follow `consolidator.salienceWeights`.
  - Offline fusion-weight fitting: new pure `fitFusionWeights(cases, { grid, k })` + `ndcgAtK` in `@graphorin/memory/search` grid-search `FusionWeights` against labelled queries and report the plain-RRF baseline alongside.
  - Extraction decontextualization (memory-consolidation-08): each extracted fact must now be a self-contained proposition (pronouns/ellipses resolved, entities inlined).
  - rerankers.md rewritten: warns against installing a positional `WeightedRRFReranker` as process default (mis-assigns weights under fan-out - memory-retrieval-04), promotes the local cross-encoder as the first learned reranker to reach for, documents the fitting routine and the trust discount.

- [#136](https://github.com/o-stepper/graphorin/pull/136) [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84) Thanks [@o-stepper](https://github.com/o-stepper)! - Deterministic security adoptions (audit 2026-07-04 Wave C, cluster C6).

  - Derived-taint propagation: opt-in `dataFlowPolicy.derivedTaint: 'strict'` fires the paraphrase-robust `derived-untrusted-to-sink` flow for every model-driven sink call once untrusted content entered the run (CaMeL-style control-flow integrity); the agent also records each tainted step's assistant text as `llm-derived` spans so model-echoed phrasing trips the verbatim probe.
  - Taint into memory (cross-session MINJA leg): `ToolReturn` gains a widen-only `taint` override honoured through the executor record path; `fact_search` / `deep_recall` / `recall_episodes` attach it when any returned item is quarantined or foreign-provenance, re-arming the ledger at recall. `RunState.taintSummary` additionally carries one-way FNV-1a span-tile hashes (no plaintext), so a resumed run re-detects pre-suspend verbatim copies.
  - MCP pinning completed: `toTools({ pinStore })` records fingerprints on first use and REJECTS drift by default when a store is present (rug-pull defense; `onPinMismatch: 'warn'` downgrades); tool-description injection hits at registration are counted (`mcp.tool-description.injection-flagged.total`).
  - Signal-only heuristics + Unicode pre-pass: shared `normalizeForMatching` (NFKC + zero-width strip) applied in the guardrails injection catalogue and the memory quarantine heuristics; security.md repositions all pattern catalogues as best-effort signal, never a sole gate. `TaintLabel.sourceKind` widened to `string` for the new descriptive kinds.

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

- [#134](https://github.com/o-stepper/graphorin/pull/134) [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6) Thanks [@o-stepper](https://github.com/o-stepper)! - Fix three context-assembly defects (context-engine-02/03/04). The default post-compaction hooks (persona block, project rules, pinned facts) now apply the same D2 privacy decision as `assemble()`, so `sensitivity:'secret'` content the assembly withholds can no longer leak to the provider via the post-compaction splice. `renderMessageText` renders assistant tool-call arguments and `adaptTokenCounter` preserves the native `count(messages)` path, so tool-call args (file writes, code_execute scripts) finally contribute to trigger/before/after token arithmetic. And the trigger, SOTA-4 reclaim floor, and anti-thrash guard now share one full-buffer basis: `shouldCompact` takes `compactableFromIndex` (the pinned prefix is no longer counted as reclaimable) and `compactNow` takes `prefixMessages` so the guard arms against prefix + body + essentials instead of the sliced body - previously any real system prompt defeated the guard and a summarizer LLM call re-fired every step at the context edge.

- [#134](https://github.com/o-stepper/graphorin/pull/134) [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6) Thanks [@o-stepper](https://github.com/o-stepper)! - Enforce transcript well-formedness so no path emits provider-rejected message sequences (agent-01, tools-07, context-engine-01). The durable-HITL pre-screen now collects EVERY approval-gated call in a step (not just the first) and executes the non-gated remainder before suspending, so the persisted transcript never carries dangling `tool_use` ids; `executeBatch` synthesizes an `execution_failed` outcome instead of silently dropping a slot whose `executeOne` rejected (e.g. a throwing tracer); summarize-compaction snaps its boundary backward so the preserved window never starts with an orphan `tool` message. The agent mock-provider harness now asserts transcript well-formedness on every request by default.

- [#135](https://github.com/o-stepper/graphorin/pull/135) [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3) Thanks [@o-stepper](https://github.com/o-stepper)! - Retrieval and consolidation now honour the trust contracts they document (audit 2026-07-04 Wave B, cluster B3).

  - memory-retrieval-01: default fact reads (FTS / vector / graph) behave as `asOf = now`, so superseded and validity-expired facts no longer surface as current - exactly what the `fact_supersede` tool promises. New `includeSuperseded: true` escape hatch (core `MemorySearchOptions`, memory `FactSearchOptions`, graph expand options) restores the full history for inspector / audit paths; `fact_search` and `deep_recall` outputs expose `validTo` / `supersededBy`.
  - memory-retrieval-02: `deep_recall` passes `forceHard: true` (choosing the tool IS the hardness signal; the local heuristic gate rejected the tool's own documented examples and is English-only). Iterative results carry a new `graded` flag so ungraded single-shot passes stop claiming sufficiency as a verdict.
  - memory-retrieval-03: a tagged search widens the fusion pool the same way decay does - the record-level tags filter runs after the topK cut, so tagged searches no longer silently return fewer than topK hits.
  - memory-consolidation-01: the deep-phase dedup verdict now soft-forgets (replayable tombstone) instead of preferring the GDPR hard-delete `purge`, and a vanished conflicting fact skips the judge entirely (admit, no provider call) - a model verdict can no longer hard-delete the only surviving copy.
  - memory-consolidation-07: the standard phase gains an embedder-independent exact-text duplicate guard (FTS + string equality, quarantine-aware), so replaying a partially-committed slice (DLQ / cursor retry) without an embedder no longer duplicates already-committed facts.

- [#135](https://github.com/o-stepper/graphorin/pull/135) [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3) Thanks [@o-stepper](https://github.com/o-stepper)! - Compaction-seam hardening (audit 2026-07-04 Wave B, cluster B4).

  - context-engine-05: the agent's pinned-prefix scan stops at the `<graphorin_compaction_summary>` marker, so a compaction summary resumed from a suspended run stays compactable instead of being absorbed into the uncompactable prefix (one extra pinned summary per compact-then-resume cycle).
  - context-engine-06: hard context overflow gets a last-resort tier - on a `context-length` provider error the agent forces ONE aggressive compaction (`preserveRecentTurns: 2`) and retries the same provider before walking the fallback chain or failing. Thrown `ProviderHttpError`s now classify by their canonical `errorKind`, so a thrown 429 / overflow is treated like the structured-event equivalent.
  - context-engine-07: the summarizer prompt's older-messages dump is capped (default 96k chars, `summarizerInputCharBudget` strategy option; oldest lines elided with a marker) so pointing `summarizerModel` at a smaller model no longer overflows its window and silently disables compaction.
  - context-engine-09: `<<<older_messages>>>` / `<<</older_messages>>>` sequences inside message text are neutralized before entering the summarizer prompt's data-only envelope - a tool result carrying the closing marker can no longer inject instructions into the summarizer.
  - context-engine-10: new integration test drives the REAL context engine through the agent loop with tool loops crossing the threshold; the mock provider's transcript invariant validates every post-compaction request.

- [#135](https://github.com/o-stepper/graphorin/pull/135) [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3) Thanks [@o-stepper](https://github.com/o-stepper)! - Consolidator operational promises now hold (audit 2026-07-04 Wave B, cluster B5).

  - memory-consolidation-02: `onExceed: 'log'` (the shipped standard/full presets) finally WARNs - once per resource per budget window, via a pluggable `BudgetTrackerOptions.logger`. New `priceUsage` hook on `CreateConsolidatorOptions` / `createMemory({ consolidator })` threads a USD pricer into every phase, so `maxCostPerDay` can actually accumulate spend (previously every call priced at $0 and the USD ceiling was inert at every tier).
  - memory-consolidation-03: `drainDlq` has a production caller - every `trigger(...)` dispatch first replays ready (backoff-gated) dead-letter batches, so failed slices no longer accumulate forever. A separate-process `graphorin consolidator drain` CLI was deliberately NOT added: replays require the provider, which lives in the server process (same IP-4 boundary the CLI already documents for set-tier/stop).
  - memory-consolidation-04: at tiers without a deep phase (free/cheap defaults) pending CONFLICT-CHECK rows older than 7 days are expired as `admit` (the safe direction - the candidate stays live), so the queue cannot grow monotonically.
  - memory-consolidation-05/06: the guide's phase table now describes what the phases actually do (light = zero-LLM forgetting; standard = extraction + reconcile + episodes; deep = conflict judge + reflection; no procedural extraction, no shared-tier promotion) plus a new "Making it run" subsection documenting that the library-mode consolidator is dormant until `start()` + trigger wiring.
  - memory-consolidation-08: extraction is temporally anchored - each transcript line carries its ISO timestamp and the prompt states today's date with an instruction to resolve relative dates into absolute ones.

- [#138](https://github.com/o-stepper/graphorin/pull/138) [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a) Thanks [@o-stepper](https://github.com/o-stepper)! - Documentation-truth sweep (audit 2026-07-04 Wave E, cluster E10): stale npm package descriptions rewritten (cli "Phase 14a three commands", mcp "upcoming auth CLI", store-sqlite's nonexistent WorkerPool), the store-sqlite WorkerPool TSDoc and the cipher-pragma ordering comment corrected, the executor timeout-precedence JSDoc fixed to the real `inlineToolTimeoutMs > tier timeoutMs > default` order, the `rrf.<label>` explain signals documented, and the skills spec-snapshot wording no longer claims a CI cron refreshes it (the diff is a manual `--upstream` pass; the release gate only parses the bundled snapshot).

- [#138](https://github.com/o-stepper/graphorin/pull/138) [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a) Thanks [@o-stepper](https://github.com/o-stepper)! - Release-pipeline and tarball-surface fixes (audit 2026-07-04 Wave E, cluster E2). `@graphorin/memory`'s `./conflict` subpath was runtime-EMPTY on npm 0.5.0 (`export { };` - preserveModules emitted the module without an explicit tsdown entry); it now ships all 8 runtime exports. `@graphorin/server`'s internal `workspace:*` peer dependencies are ranged (`workspace:>=0.5.0 <1.0.0`) so changesets stops escalating every sibling bump into a bogus MAJOR for the whole fixed group (the 1.0.0 landmine on the release bot's branch). `@graphorin/eslint-plugin` gains the `./package.json` self-export. All 27 per-package CHANGELOGs gain the 0.5.0 section (they were frozen at 0.1.0 inside every published tarball), and the `mvp-readiness` release gate now rejects a stale-CHANGELOG or unresolvable-exports release.

- Updated dependencies [[`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a)]:
  - @graphorin/tools@0.6.0
  - @graphorin/core@0.6.0
  - @graphorin/security@0.6.0
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

- Phase 10a - initial release of `@graphorin/memory`. Ships the
  `createMemory()` facade with six tier sub-modules (working,
  session, episodic, semantic, procedural, shared), nine memory
  tools registered through `@graphorin/tools`, the built-in
  `RRFReranker` with a pluggable `setReranker(...)` hook, the
  embedder migration runner with `lock-on-first` / `multi-active` /
  `auto-migrate` strategies, and the `compile()` / `metadata()` /
  `consolidator` interface stubs picked up by Phases 10b / 10c /
  10d.
