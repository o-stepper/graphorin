---
'@graphorin/core': patch
'@graphorin/store-sqlite': patch
'@graphorin/memory': patch
---

P2-2 — procedural memory extraction (AWM-style workflow induction)
(see `memory-improvement-proposals.md` §5, summary-table row **P2-2 ·
Procedural memory extraction (AWM-style)**). The procedural tier could store
author-defined "how to do things" but nothing *learned* them. Induction
distils a reusable workflow from a **successful** agent trajectory and stores
it in the procedural tier — so the assistant gets faster and more consistent
at recurring tasks over time. All changes are additive ⇒ `patch` (pre-1.0).

- **`Rule` gains structured-procedure fields** (`@graphorin/core`):
  `steps` / `variables` / `successCriteria` + `provenance` / `status`
  (previously only `Fact` / `Episode` / `Insight` carried provenance +
  status). `MemoryProvenance` adds `'induction'` — a *derived* tag alongside
  `'extraction'` / `'reflection'`, so induced memory is treated as
  quarantine-by-default. Author-defined rules omit every new field, so legacy
  rows are byte-identical plain rules.
- **Migration 017** (`@graphorin/store-sqlite`): five additive nullable
  columns on `rules` (`steps_json`, `variables_json`, `success_criteria_json`,
  `provenance`, `status`) — an induced procedure *is* a procedural rule with
  extra structure, so it rides the existing row (no new table). The default
  adapter persists + surfaces them; existing rows read back as NULL ⇒
  undefined ⇒ unchanged.
- **Workflow induction seam** (`@graphorin/memory`, new
  `consolidator/phases/induce.ts`): a provider-agnostic seam mirroring the
  P2-3 / P2-4 retrieval seams — pure `buildInductionRequest` + tolerant pure
  `parseInducedProcedure` / `normalizeInducedProcedure` (reconciles the
  variable list with the `{placeholder}`s actually in the steps, so the
  abstraction is grounded) + a resilient `createProviderWorkflowInducer` (a
  provider throw degrades to `null`, never propagates) + a pure orchestrator
  `runWorkflowInduction` that does no I/O. **Successful-trajectories-only
  gate**: a failed / empty trajectory yields `null` *without calling the
  inducer*. `checkSuccessCriteria` is a deterministic, offline self-verifier
  for reuse.
- **No agent change needed.** The agent already emits the full, serializable
  `RunState` (`steps[]` + `messages[]` + `status`); `trajectoryFromRunState`
  distils it into the minimal `Trajectory` the inducer consumes, with
  `succeeded = status === 'completed'` as the AWM online-mode success signal.
- **`ProceduralMemory.induce(scope, trajectory)`** (+ `induceFromRun(scope,
  runState)`) stores the induced procedure **quarantined** +
  `provenance: 'induction'` (P1-4 — the highest-poisoning-risk write, since
  procedures drive actions). `activate()` now **excludes quarantined
  procedures** (they must not drive actions until validated) while `list()`
  still surfaces them. `define(...)` round-trips a hand-authored structured
  procedure.
- **Wiring** (opt-in): `createMemory({ procedureInduction: { provider } })`
  builds the inducer. Omitted ⇒ `induce(...)` throws
  `ProcedureInductionNotConfiguredError` and the procedural tier stays pure
  offline CRUD — no provider call.

The default code path remains fully offline and byte-for-byte unchanged:
the new `Rule` fields are absent on author-defined rules, induction is opt-in
and gated to successful trajectories, and induced procedures are quarantined
out of activation.
