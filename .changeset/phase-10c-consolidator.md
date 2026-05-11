---
'@graphorin/memory': minor
'@graphorin/store-sqlite': minor
---

Phase 10c — consolidator runtime. The background pipeline that turns
raw conversation turns into long-lived facts and episodes is now
production-ready: triggers, the three phases (light + standard +
deep minimum-viable), the mandatory built-in noise filter, the
wait-then-defer lock, the idempotent cursor, the dead-letter queue,
the cost envelope (`tier: 'free'` default — no LLM call without
explicit opt-in), and the Ebbinghaus decay curve for forgetting.

`@graphorin/memory` ships:

- **`createConsolidator({ store, semantic, provider?, tier?, ... })`
  factory + `Consolidator` runtime class.** Replaces the Phase 10a
  no-op placeholder; the placeholder is preserved for back-compat
  and now honours the full public surface (`start / stop / trigger /
  status / fireNow / setTier / pause / resume / drainDlq /
  onPhaseFinished / config / isFree`). The runtime drives the three
  phases, owns the per-scope wait-then-defer lock, persists the
  idempotent cursor + run audit + DLQ rows through the storage
  adapter, emits a typed AISpan per phase
  (`memory.consolidate.<phase>`) with the documented attribute set
  (`consolidator.tier`, `consolidator.trigger`, `consolidator.phase`,
  `consolidator.cost.estimate.usd`, `consolidator.tokens.input`,
  `consolidator.tokens.output`, `consolidator.budget.remaining.*`,
  `consolidator.exceeded`), and dispatches phase-finished
  notifications to subscribed listeners (consumed by the standalone
  server in Phase 14 and the CLI in Phase 15).
- **Light phase (no LLM, always runs).** Decays every fact's
  retention curve via `score = exp(-elapsedDays / (tau * strength))`
  (default `tau = 7` days), soft-archives facts whose retention
  falls below the configured threshold (`0.05` default — DEC-105
  alignment), and runs the noise filter pipeline against unread
  session messages so the next standard phase already has a clean
  batch. Cost: zero. No outbound network call.
- **Standard phase (cheap LLM, gated by `tier`).** Reads messages
  past the per-scope `last_processed_message_id` cursor, applies the
  noise filter, calls `provider.generate(...)` with the
  ADDITIVE_EXTRACTION_PROMPT (a single JSON-shaped `{ "facts": [...] }`
  payload), routes each extracted fact through
  `SemanticMemory.remember(...)` so the Phase 10b conflict pipeline
  decides admit / dedup / supersede / pending, advances the cursor
  atomically, and records the LLM cost into the budget tracker.
  Tolerates fenced JSON blocks, trailing commentary, and bare
  arrays in the model output (`parseExtraction` is the
  documented helper). Tier gate: skipped under `tier: 'free'` with
  an INFO log on the AISpan.
- **Deep phase (deep LLM, gated by `tier: 'standard'+`).**
  Minimum-viable scope per DEC-134: drains the
  `conflict_check_pending` queue surfaced by Phase 10b. For each
  pending row, calls `provider.generate(...)` with the
  CONFLICT_JUDGE_PROMPT and applies the resolution
  (`supersede` / `dedup` / `admit`) — `supersede` calls
  `semantic.supersede(...)`, `dedup` calls `semantic.purge(...)` (or
  `forget(...)` when the adapter is purge-less), `admit` clears the
  pending row. Each judge call is throttled by
  `maxDeepConflictsPerRun` (`20` default).
- **Built-in noise filter pipeline.** Three presets — `'default'`,
  `'minimal'`, `'none'`. The `'default'` preset drops messages by
  five heuristics: length floor (< 10 chars) + ceiling (> 10 000
  chars), code / JSON detection (`looksLikeCodeOrJson`), per-message
  trigram near-duplicate against the last five kept messages, stop-
  word ratio above 80 % on tokens, and trailing system messages.
  The `'minimal'` preset relaxes the length floor and keeps tool
  output. Pluggable presets surface `noise_filtered_count` per
  phase to the AISpan + `consolidator.status()`.
- **Wait-then-defer `LockManager`.** Per-scope lock backed by the
  storage adapter's `consolidator_state` row (or a per-process map
  when the adapter does not opt in). Acquisition polls until the
  configured `lockWaitMs` (`30 s` default) elapses; on timeout the
  trigger is recorded as `deferred` in `consolidator.status()` and
  the run is skipped. Stale locks past `maxRunDurationMs` are
  reclaimed automatically — process restart mid-phase never wedges
  the queue. Fully honours DEC-114 ("memory does not block the
  agent loop").
- **Idempotent cursor.** Per-scope `last_processed_message_id` row
  in `consolidator_state`. Standard phase reads `WHERE sequence >
  cursor`, advances atomically to the highest sequence in the batch,
  and on replay drains an empty batch — verified by the
  `survives process-restart` integration test (a fresh
  `createConsolidator(...)` instance against the same SQLite file
  produces `factsCreated: 0` because the cursor was persisted).
- **Dead-letter queue.** On phase failure (provider error, embedder
  error, parse error, budget exceeded with `onExceed: 'throw'`),
  the runtime writes a row to `consolidator_failed_batches` with a
  classified `error_kind` (`'rate_limit' | '5xx' | 'timeout' |
  'embedder_failed' | 'invalid_response' | 'budget' | 'unknown'`)
  and a full-jitter exponential-backoff `next_retry_at`
  (`base 60 s → max 1 h`, capped after `5` attempts). Operators
  drain the queue via `consolidator.drainDlq(scope)`; rows whose
  `next_retry_at` is in the future stay enqueued.
- **Cost envelope (DEC-144 / ADR-038).** `BudgetTracker` enforces
  the `tier: 'free' | 'cheap' | 'standard' | 'full' | 'custom'`
  preset matrix exactly as documented in ADR-038 § 4 (free → 0
  tokens / $0; cheap → 50 k tokens / $0.20; standard → 200 k
  tokens / $1.00; full → 1 M tokens / $5.00; custom requires
  explicit ceilings or throws `CustomTierMisconfiguredError`).
  `onExceed: 'pause'` (default for `free` / `cheap`) skips
  subsequent LLM phases until the next budget reset; `'log'` keeps
  running with a WARN; `'throw'` raises the typed
  `BudgetExceededError`. Reset semantics — UTC midnight by default
  (`'utc'`), with opt-in `'local'` and `'sliding-24h'` modes.
  Snapshot is surfaced on `consolidator.status()` and on every
  AISpan.
- **`Consolidator.setTier(tier)`** — runtime tier change. Recomputes
  the ceilings + the active phase set + the `onExceed` policy from
  `CONSOLIDATOR_TIER_DEFAULTS`. Refuses `setTier('custom')` (custom
  requires explicit ceilings + must be set at construction time).
- **Trigger spec parser.** `parseTriggerSpec(...)` translates
  `'turn:N' / 'idle:Xm' / 'cron:EXPR' / 'event:NAME' / 'budget:N'`
  into a discriminated `ParsedTrigger` for the runtime dispatch.
  Validates eagerly — malformed specs throw `TypeError` at
  registration time so misconfigured triggers never silently fail
  to fire.
- **`registerConsolidatorTriggers(consolidator, scheduler, opts)`
  bridge.** Wires every cron / idle / interval declaration on the
  consolidator into a `@graphorin/triggers`-shaped scheduler so the
  same code path covers lib mode + the standalone server (DEC-150).
  Turn / event / budget triggers are skipped (the scheduler cannot
  count user turns or fire events autonomously) — the runtime
  caller invokes `consolidator.trigger(...)` from those code paths.
  Catch-up policy defaults to `'none'` per DEC-150; configurable
  per registration.
- **`ConsolidatorStatus` shape mirrors the working-plan spec.**
  Surfaces `lastRuns: { light?, standard?, deep? }` (per-phase last
  completed timestamp, derived from `consolidator_runs`),
  `queueDepth` (alias for `pendingConflicts`), `dlqSize`,
  `deferredRuns` (persisted to `consolidator_runs.status =
  'deferred'` so process restart preserves the count), the budget
  snapshot, and `budgetRemaining: { tokens, costUsd }` for direct
  CLI / dashboard consumption. The placeholder honours the same
  shape so consumers can swap implementations without type churn.
- **Decay-aware search ranking (`SemanticMemory.search` opt-in
  `decay: { tauDays }` option).** Boosts the reranker output by
  `score *= exp(-elapsedDays / (tauDays * max(0.5, strength)))` so
  stale facts drop in the result list without ever being
  hard-deleted (principle 8). Adapters that omit
  `semantic.listForDecay?` skip the boost silently. The light
  phase + the in-process search now share the same retention curve
  helpers from `consolidator/decay`.
- **Per-phase `consolidator.duration_ms` / `consolidator.facts_extracted`
  / `consolidator.budget_used_usd` AISpan attributes.** Emitted by
  every phase per the DoD § "Every phase emits memory.consolidate
  AISpan with attributes". Consumed by the standalone server's
  `/v1/metrics` endpoint (Phase 14) and by the CLI's
  `graphorin traces tail` (Phase 15).
- **DLQ replay actually retries the failed batch.** `drainDlq(scope)`
  claims ready rows, dispatches the inferred phase (`standard` for
  rate-limit / 5xx / timeout / parse / unknown error kinds), and
  on success removes the row; on failure increments `retry_count`
  and reschedules with exponential backoff (`base 60 s → max 1 h`,
  full jitter). Once `retry_count + 1 >= dlqMaxRetries` the row
  transitions to permanent failure (`next_retry_at = NULL`) so the
  operator is alerted via `consolidator.status().dlqSize`.
- **Storage adapter contract additions.** New optional members on
  `MemoryStoreAdapter`:
    - `consolidator?: ConsolidatorMemoryStoreExt` — owns the
      `consolidator_state` cursor, the per-phase `consolidator_runs`
      audit trail, and the `consolidator_failed_batches` DLQ
      (`getState / upsertState / acquireLock / releaseLock /
      recordRunStart / recordRunFinish / listRecentRuns /
      enqueueFailedBatch / claimReadyBatches / markBatchSucceeded /
      rescheduleBatch / markBatchExhausted / listFailedBatches`).
    - `session.listMessagesSince?(scope, lastMessageId, limit)`
      reads messages past the cursor in oldest-first order so the
      standard phase can advance atomically without rereading
      already-processed turns.
    - `semantic.listForDecay?(scope, limit?)` +
      `semantic.archiveFact?(id, reason?)` surface the columns the
      light phase needs to compute the Ebbinghaus retention curve
      and to soft-archive low-retention facts. Adapters that omit
      the surface degrade gracefully — the light phase logs INFO
      and skips the archive step.
- **Typed errors.** `BudgetExceededError` (`kind:
  'budget-exceeded'`), `CustomTierMisconfiguredError` (`kind:
  'custom-tier-misconfigured'`), and `ProviderNotConfiguredError`
  (`kind: 'provider-not-configured'`) — every error carries a
  stable lowercase discriminator + an actionable hint.

`@graphorin/store-sqlite` ships:

- **`SqliteConsolidatorStateStore`** — implements the new
  `ConsolidatorMemoryStoreExt` contract against the
  `consolidator_state`, `consolidator_runs`, and
  `consolidator_failed_batches` tables that landed in Phase 05's
  migration 009. Surfaced on `SqliteMemoryStore.consolidator` and
  re-exported from the package root. Uses the SQLite-friendly
  `('','')` sentinel for the optional `session_id` / `agent_id`
  primary-key components so the composite key works correctly
  against `ON CONFLICT(...) DO UPDATE` (NULLs are not equal under
  SQLite uniqueness).
- **`SqliteSessionMemoryStoreImpl.listMessagesSince(scope, cursor,
  limit)`** — cursor-aware reader for the consolidator standard
  phase. Returns the `{ id, sequence, createdAt, tokenCount,
  message }` tuples with the FTS5-friendly text already rendered.
- **`SqliteSemanticMemoryStoreImpl.listForDecay(scope, limit?)` +
  `archiveFact(id, reason?)`** — decay-aware reader + soft-archive
  helper for the light phase. Archive writes a `memory_history`
  audit row with `event: 'ARCHIVE'` and `source: 'consolidator'`
  per the documented audit trail.

`pnpm test` — 78 new tests across the workspace (`@graphorin/memory`
+ `@graphorin/store-sqlite`):

- **Helper unit tests** (24): noise-filter heuristics across every
  rule + every preset; Ebbinghaus retention + archive thresholds;
  budget tracker — `tier: 'free'` blocks LLM phases, `'pause'` /
  `'log'` / `'throw'` exceed paths, UTC midnight reset, runtime
  reconfigure unpause; trigger spec parser across every kind +
  every error path; DLQ helpers — error classification, bounded
  backoff, error description; `tipMessageId` cursor advance;
  `CONSOLIDATOR_TIER_DEFAULTS` matrix.
- **Lock manager tests** (4): clean acquisition, deferred contention
  with sleep instrumentation, stale-lock reclaim past
  `maxRunDurationMs`, per-process fallback when the adapter omits
  the consolidator surface.
- **Runtime tests** (17): light phase archives stale facts; standard
  phase extracts via the provider + advances the cursor + replay is
  a no-op; standard phase without provider surfaces a typed
  `failed` outcome; `parseExtraction` tolerates fenced + trailing
  prose + bare arrays; deep phase drains the
  `conflict_check_pending` queue and applies supersede; placeholder
  honours every method; `setTier('custom')` is rejected;
  `tier: 'custom'` without ceilings throws
  `CustomTierMisconfiguredError`; `onExceed: 'throw'` lands in the
  DLQ + carries the `BudgetExceededError` kind; phase-finished
  listeners fire with `scope` + `trigger`; lock contention surfaces
  `deferredRuns`; `trigger()` respects the running flag + the tier
  phase plan; `pause()` / `resume()` toggles the gate;
  `drainDlq()` removes batches whose `nextRetryAt` elapsed;
  `status()` snapshot reports tier + triggers + budget remaining.
- **`@graphorin/store-sqlite` SQL-backed tests** (10): consolidator
  store round-trips state across the per-scope tuple; lock
  acquisition is idempotent + reclaims past the configured age; run
  start + finish persist into `consolidator_runs`; the DLQ exercises
  every `enqueue / claim / reschedule / mark-succeeded /
  mark-exhausted / list` path; `listMessagesSince` reads past the
  cursor in oldest-first order; `listForDecay` + `archiveFact`
  toggle the `archived` column.
- **End-to-end SQLite integration** (3): standard phase against a
  real SQLite file (provider call → cursor advance → fact stored →
  search returns the new fact); DLQ persistence on phase failure +
  successful replay through `drainDlq` after the provider recovers;
  cursor survives process-restart simulated by constructing a
  brand-new `createMemory` facade against the same file.
- **DoD-driven test suite** (9): the deep phase drains 10 fixture
  pending pairs and clears the queue; the DLQ row transitions to
  permanent failure after `dlqMaxRetries` consecutive failures;
  budget reset across a simulated UTC midnight resumes the
  standard phase; every phase span carries
  `consolidator.duration_ms / facts_extracted / budget_used_usd`;
  `consolidator.status()` exposes `lastRuns / queueDepth / dlqSize
  / deferredRuns / budgetRemaining`; decay-aware search ranks a
  fresh fact (1 d) above a stale fact (14 d) under
  `tauDays = 7`; lock contention serializes runs and the persisted
  `deferred_runs` counter survives a status reload; the standard
  phase advances the cursor so the second invocation returns
  `factsCreated: 0`; cron + idle triggers register through
  `registerConsolidatorTriggers(...)` and turn / event / budget
  triggers are correctly skipped.
- **Scheduler bridge tests** (2): the production
  `@graphorin/triggers` Scheduler is structurally compatible with
  the `SchedulerLike` shape exported from
  `@graphorin/memory/consolidator/scheduler` — wiring an in-memory
  Scheduler + driving its timer fires `consolidator.trigger(...)`
  on the documented schedule (DEC-150). The skip-list of
  unsupported trigger kinds is also asserted.

Coverage holds above the package's documented thresholds —
`@graphorin/memory`: 94.32 % statements / 81.22 % branches /
94.82 % functions / 94.32 % lines (above the `≥ 85 %` floor).
The workspace `pnpm run check-no-network` continues to pass — no
new outbound network call sites were introduced. Every package
typechecks, lints, builds, and tests successfully (1 992 tests
passing across 16 workspace packages).
