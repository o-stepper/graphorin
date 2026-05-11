---
'@graphorin/memory': minor
'@graphorin/store-sqlite': minor
---

Phase 10b — multi-stage conflict resolution pipeline. Every
`SemanticMemory.remember(...)` call now flows through a five-stage
pipeline so semantic memory writes can no longer silently admit a fact
that contradicts an existing one. The pipeline ships English markers by
default and is fully pluggable per locale.

`@graphorin/memory` ships:

- **`createConflictPipeline({...})` orchestrator + `runConflictPipeline({ candidate, deps, options? })`
  free helper.** Both surfaces are wired into `SemanticMemory.remember(...)`;
  the helper mirrors RB-02 §8.1's documented signature for one-shot
  callers, the factory caches the pipeline configuration for the
  per-`Memory` happy path. Five stages run in declaration order:
    - **Stage 1 — exact dedup.** MD5 hash on the canonical (lowercase +
      collapsed-whitespace + trimmed) fact body short-circuits with
      `{ kind: 'dedup', existingId, similarity: 1 }` on a hit.
    - **Stage 2 — embedding three-zone.** Top-K neighbours from
      `searchVector` classify the candidate into HOT (`>= hot`), NEAR-
      DUP (`>= nearDup`), CONFLICT-CHECK (`> cold`), or COLD with
      defaults `0.95 / 0.85 / 0.4` per RB-02 §8 / DEC-117. HOT is the
      only zone that can override the heuristic stages — semantic
      identity outranks every other signal.
    - **Stage 3 — heuristic regex (per-locale, pluggable).** The active
      locale pack's supersede + negation markers fire whenever the
      candidate carries an explicit change signal (`moved to`, `no
      longer`, `got promoted`, …) and Stage 2 surfaced at least one
      existing candidate.
    - **Stage 4 — subject/predicate match.** Naive `(subject,
      predicate, object)` split using the locale pack's predicate
      normalisers; matching subject + predicate with a different
      object is a strong supersede signal (matching object → silent
      dedup).
    - **Stage 5 — defer to deep LLM judge.** Reached only when Stages
      1–4 left the decision unresolved and the candidate sits in
      Stage 2's CONFLICT-CHECK zone. The candidate is admitted with a
      `pending` flag and queued in `conflict_check_pending`; the
      consolidator's deep phase (Phase 10c) drains the queue.
- **Bundled `enLocalePack`** covering the most common
  personal-assistant change signals across location, job, preference,
  relationship, and health categories. **`defineLocalePack({...})`
  builder** registers additional locales (community-supplied); the
  builder freezes every input so packs can be safely shared across
  multiple `Memory` instances.
- **Strict per-`Memory` configuration via `createMemory({
  conflictPipeline })`.** Configurable threshold overrides, custom
  locale pack, custom audit / pending sink, and a `mode: 'off'` opt-out
  that falls back to the 10a straight-through write path. Disabling
  the pipeline emits a one-shot WARN per process so operators notice
  the regression risk per the Phase 10b spec.
- **Per-call `pipeline: 'off'` opt-out + `signal?: AbortSignal`.**
  `SemanticMemory.remember(scope, input, { pipeline: 'off', signal })`
  skips the pipeline for a single write — used internally by
  `SemanticMemory.supersede(...)` so the explicit user-driven supersede
  is not double-processed. `signal` is forwarded to the embedder +
  storage layers; an aborted signal raises the canonical
  `AbortError` (`DOMException` with `name === 'AbortError'`) per
  CONVENTIONS § Async/streams + DEC-143.
- **`SemanticMemory.rememberWithDecision(...)` companion API** that
  returns the typed `RememberOutcome = { fact, decision }` so callers
  can distinguish silent dedups (`decision.kind === 'dedup'`) from
  fresh inserts and pending deferrals.
- **AISpan `memory.conflict` per pipeline run** with
  `{ candidate_id, locale_pack, stage, decision, candidate_count,
    similarity, reason }` — wired through the existing tracer so the
  no-op tracer remains a drop-in for unit tests.
- **Audit + pending storage extension** —
  `ConflictMemoryStoreExt` is the new optional surface on
  `MemoryStoreAdapter` (`recordDecision` + `enqueuePending` +
  `listPending` + `markResolved`). Adapters that omit the extension
  keep the pipeline functional but skip persistence (graceful
  degradation). The pending-queue payload now carries the full
  `conflictingIds: ReadonlyArray<string>` Stage 2 surfaced so the
  Phase 10c LLM judge can evaluate every contender, not just the top
  hit.
- **Public types + builder exports.** `ConflictDecision` (with the
  documented `pending` variant carrying `candidateId` +
  `conflictingIds`), `ConflictPipeline`, `ConflictPipelineDeps`,
  `ConflictPipelineOptions`, `ConflictStage`, `ConflictThresholds`,
  `DEFAULT_CONFLICT_THRESHOLDS`, `StageContext`, `StageOutcome`,
  `PipelineStage`, `LocalePack`, `LocaleSupersedeKind`,
  `LocalePatternEntry`, `LocaleMatch`, `defineLocalePack`,
  `enLocalePack`, `evaluateMarkers`, `createConflictPipeline`,
  `runConflictPipeline` — every symbol is also re-exported from the
  package root and from the new `@graphorin/memory/conflict` subpath
  export.

`@graphorin/store-sqlite` ships:

- **Migration `011-fact-conflicts.sql`** introduces the `fact_conflicts`
  audit table (one row per pipeline decision) with indexes for
  per-user replay and per-fact lookup.
- **Migration `012-conflict-check-conflicting-ids.sql`** adds the
  `conflicting_ids_json` column to `conflict_check_pending` so
  Stage 5 deferrals carry every conflicting existing fact id (Phase
  10c's deep LLM judge needs the full list, not just the top hit).
- **`SqliteConflictStore`** implements the new
  `ConflictMemoryStoreExt` surface: `recordDecision(...)` writes to
  `fact_conflicts`; `enqueuePending(...)` writes to
  `conflict_check_pending` (incl. the `conflicting_ids_json` payload);
  `listPending(...)` parses the JSON list back, `markResolved(...)`
  round-trips the deep-phase resolution. Surfaced on
  `SqliteMemoryStore.conflicts` and re-exported from the package
  root. Decision rows are returned in stable id-DESC order for
  deterministic replay.
- **`SqliteSemanticMemoryStoreImpl.searchVector(...)` +
  `SqliteEpisodicMemoryStoreImpl.searchVector(...)`** complete the
  per-tier vector-search surface — Phase 10a registered the
  `searchVector` extension method on the typed adapter contract but
  the SQLite implementation only landed FTS5 search; Phase 10b adds
  the `vec0` JOIN with the `WHERE embedder_id = ?` guard from
  ADR-023 / DEC-116 so multi-active migrations never bleed cross-
  embedder hits.

`pnpm test` — 102 new tests across the workspace (`@graphorin/memory`
+ `@graphorin/store-sqlite`):

- **Locale-pack unit tests** (7): every documented relocation / job /
  preference / relationship / health marker matches; `defineLocalePack`
  freezes inputs; `evaluateMarkers` picks the highest-confidence match
  on overlapping hits.
- **Per-stage unit tests** (19): Stage 1 dedup hit + miss + a
  fast-check property test asserting the canonical hash is invariant
  under whitespace + case permutations on real `Fact` inputs; Stage
  2 HOT / NEAR-DUP / CONFLICT-CHECK / COLD zones; Stage 3 supersede
  + negation markers + plain factual statements; Stage 4 same triple
  → dedup, different object → supersede, no-triple fallback; Stage 5
  pending payload + empty fallback.
- **Pipeline orchestrator + integration tests** (22): every decision
  variant; threshold validation; locale-pack swap; missing conflict
  store graceful degradation; `mode: 'off'` short-circuit + one-shot
  WARN; `pipeline: 'off'` per-call opt-out; the canonical regression
  test ("Lives in Boston" → "moved to Seattle" produces supersede);
  pending audit + queue verification end-to-end against the in-memory
  store; pending decision exposes both `candidateId` + the full
  `conflictingIds` ordered list; `runConflictPipeline` free-function
  helper mirrors `createConflictPipeline`; vector-search self-id
  filtering (no self-dedup); AbortSignal cancellation throws
  `AbortError` both before and mid-flight; AISpan emission with the
  full attribute set.
- **English fixture corpus** (52): 51 representative pairs covering
  every documented marker family — relocation, job change (incl. the
  newly added bare `new job` marker), preference flips, negation
  (`do not` + `not a fan` patterns), relationship transitions,
  health updates, generic supersede markers, subject/predicate
  triples, and explicit cold-zone negative cases that must not
  trigger supersede; plus a property test asserting Stage 1's
  canonical-form hash is whitespace + case invariant.
- **Performance smoke** (1): full pipeline against a 50-fact corpus
  with 11-iteration warm + median measurement stays ≤ 50 ms on a CI
  runner. The strict ≤ 5 ms / call ceiling per RB-02 §8 is enforced
  by the CI bench harness owned by RB-29 (Phase 04 follow-up).
- **SQLite-backed pipeline integration** (1): end-to-end `remember
  → searchVector → Stage 3 supersede → recordDecision` round-trip on
  the production sqlite + sqlite-vec adapter; `listRecentDecisions`
  surfaces both audit rows with the canonical pipeline stage labels.
- **`SqliteConflictStore` direct tests** (6): every method covered;
  `enqueuePending` round-trips `conflictingIds: ReadonlyArray<string>`
  through the `conflicting_ids_json` column; missing list defaults
  to empty; `markResolved` hides the row from `listPending`;
  per-user scope isolation; stable ordering by id.
- **Migration test extension**: confirms the new `011-fact-conflicts`
  + `012-conflict-check-conflicting-ids` migrations run alongside the
  existing 10 bundled migrations; the `fact_conflicts` table is
  created and the `conflict_check_pending.conflicting_ids_json`
  column is added on init.

Coverage holds above the package's `≥ 85 %` threshold
(`@graphorin/memory`: 97.45 % statements / 85.42 % branches /
97.81 % functions / 97.45 % lines). The workspace
`pnpm run check-no-network` continues to pass — no new outbound
network call sites were introduced.
