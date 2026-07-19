# @graphorin/proactive

## 0.13.1

### Patch Changes

- [#209](https://github.com/o-stepper/graphorin/pull/209) [`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4) Thanks [@o-stepper](https://github.com/o-stepper)! - Public TSDoc no longer carries internal audit/work-item ticket ids ("deep retest P1-3", "W-135", wave letters, finding families): roughly 1100 docblock sites across 28 packages were rewritten to describe the behaviour itself, with every technical statement preserved (decision-record references like ADR-x/DEC-x stay). Two runtime strings also dropped their ticket ids: the tools executor's approval-rewrite refusal message and the server's secret-resolution hint. A new `check-api-wording` gate scans the generated API reference and fails CI if ticket vocabulary ever leaks back in.

- Updated dependencies [[`7991726`](https://github.com/o-stepper/graphorin/commit/7991726fbd06426bdfb1e9c1a5c1e4bd5466d0f4)]:
  - @graphorin/agent@0.13.1
  - @graphorin/core@0.13.1
  - @graphorin/sessions@0.13.1
  - @graphorin/triggers@0.13.1
  - @graphorin/workflow@0.13.1

## 0.13.0

### Patch Changes

- Updated dependencies [[`8da43b7`](https://github.com/o-stepper/graphorin/commit/8da43b775eb5e53ef00e2ed3933aeef00d033034)]:
  - @graphorin/agent@0.13.0
  - @graphorin/sessions@0.13.0
  - @graphorin/core@0.13.0
  - @graphorin/triggers@0.13.0
  - @graphorin/workflow@0.13.0

## 0.12.1

### Patch Changes

- Updated dependencies []:
  - @graphorin/agent@0.12.1
  - @graphorin/core@0.12.1
  - @graphorin/sessions@0.12.1
  - @graphorin/triggers@0.12.1
  - @graphorin/workflow@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies [[`9bc93fe`](https://github.com/o-stepper/graphorin/commit/9bc93fe6135fdda421219fb5558bf8eb486437f7)]:
  - @graphorin/agent@0.12.0
  - @graphorin/sessions@0.12.0
  - @graphorin/triggers@0.12.0
  - @graphorin/workflow@0.12.0
  - @graphorin/core@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [[`47b6034`](https://github.com/o-stepper/graphorin/commit/47b60342dc8a345d1299a22a2fc4fe2aac50bb31)]:
  - @graphorin/core@0.11.0
  - @graphorin/agent@0.11.0
  - @graphorin/sessions@0.11.0
  - @graphorin/triggers@0.11.0
  - @graphorin/workflow@0.11.0

## 0.10.2

### Patch Changes

- Updated dependencies [[`fd159e0`](https://github.com/o-stepper/graphorin/commit/fd159e08448580d94daa3f0ac5ef1e23e4f7a553), [`fd159e0`](https://github.com/o-stepper/graphorin/commit/fd159e08448580d94daa3f0ac5ef1e23e4f7a553)]:
  - @graphorin/agent@0.10.2
  - @graphorin/sessions@0.10.2
  - @graphorin/core@0.10.2
  - @graphorin/triggers@0.10.2
  - @graphorin/workflow@0.10.2

## 0.10.1

### Patch Changes

- [#186](https://github.com/o-stepper/graphorin/pull/186) [`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7) Thanks [@o-stepper](https://github.com/o-stepper)! - P3 documentation-drift sweep from the 2026-07 e2e campaign - docstring corrections only, no behavior changes: binary-json's `URL` corruption claim (a URL stringifies to its `href`, not `{}`; CORE-PRO-02); `isAgentFallbackEligible`'s bypass list now names the real `ProviderErrorKind` values (MODEL-FAL-02); `bySensitivity` / `stripSensitiveOutputs` document their actual weak redaction-token contract with an explicit warning instead of a nonexistent part-level sensitivity annotation (AGENT-FIL-01/02); `ProtocolGuardConfig` no longer advertises a nonexistent `Agent.protocolGuard` key (LATERAL-L-03); the token-counter serializer documents the real `[file:<mimeType>]` placeholder and the counter dispatch table the real per-family OpenAI encodings (PROVIDER-CT-02/03); `RegressionOptions` tolerances document their strictly-exceeds semantics (EVALS-REP-01); the reconnect backoff formula matches the implementation (`2^(attempt-1)`; ORPHAN-SU-02); the memory guard states its five tiers (CLI-05); the proactive cron-task docs speak about E1 deny-by-name in the present tense.

- Updated dependencies [[`79ef389`](https://github.com/o-stepper/graphorin/commit/79ef3894c409c0a6b9d31fac9b6c888d4068d4e7), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a), [`15e65b2`](https://github.com/o-stepper/graphorin/commit/15e65b224ebe1170d6f840ea8af393609514e051), [`96138c2`](https://github.com/o-stepper/graphorin/commit/96138c2969e79c06a77d02b83bc33606508dea9a)]:
  - @graphorin/core@0.10.1
  - @graphorin/agent@0.10.1
  - @graphorin/sessions@0.10.1
  - @graphorin/triggers@0.10.1
  - @graphorin/workflow@0.10.1

## 0.10.0

### Patch Changes

- Updated dependencies []:
  - @graphorin/sessions@0.10.0
  - @graphorin/triggers@0.10.0
  - @graphorin/workflow@0.10.0
  - @graphorin/agent@0.10.0
  - @graphorin/core@0.10.0

## 0.9.0

### Minor Changes

- [#172](https://github.com/o-stepper/graphorin/pull/172) [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69) Thanks [@o-stepper](https://github.com/o-stepper)! - Cron-leg proactive tasks: `createProactiveCronTask` - fresh session per fire over durable triggers, REQUIRED fail-closed model pin (the fire never inherits the fallback chain), grant-to-capability mapping (`notify`/`question` fires run `capability: 'read-only'`, so acting without the grant is impossible by construction), deterministic no-recursive-scheduling guard (`schedulingToolNames` registry scan at creation, `allowRecursiveScheduling` as the explicit grant), ladder classification (completed -> `notify`/`act`; parked approvals -> `review`/`question` with a serialized `run:<runId>:<toolCallId>` resolve ref; a rung above the grant is auto-denied fail-closed) and `serializeApprovalRef`/`parseApprovalRef` helpers. The `'act'` grant is gated on evidence: `@graphorin/memory`'s facade now surfaces the configured B3 ingest gate as `memory.ingestGate` (null when inactive), and `grant: 'act'` without an active gate is a `ProactiveConfigError`.

- [#172](https://github.com/o-stepper/graphorin/pull/172) [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69) Thanks [@o-stepper](https://github.com/o-stepper)! - Escalation-ladder routing + server agent-HITL resume (closes the W-119 residual). `POST /v1/runs/:runId/resume` now resumes in-process suspensions for real: the run tracker gains `'awaiting_approval'` status with retained resumable `RunState` (`suspend`/`registerSuspended`/`suspendedStateOf`; exempt from retention pruning, cleared on settle/abort), the `/agents/:id/run` route parks suspended results instead of mislabeling them completed, and the resume body is a strict `{ approvals: [...] }` (409 for not-suspended / state-unavailable / agent-busy). `@graphorin/proactive` adds the routing layer: `outcomeToDelivery` (structural mirror of the channels `DeliveryPayload`, pinned compatible by test), `workflowAwakeableOutcome` (awakeable-parked question/review with the D-1 `wf:` ref), and the `suspendedRuns` messenger bridge on cron tasks (registers parked fires with the server tracker under `registryAgentId`, default `proactive-<id>` - avoid ':' in registry ids, it is the scope-segment separator). The client SDK's `resume(...)` now posts the directive as the body (the old `{ directive }` wrapper targeted the retired 501).

- [#172](https://github.com/o-stepper/graphorin/pull/172) [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69) Thanks [@o-stepper](https://github.com/o-stepper)! - New package `@graphorin/proactive` (the 29th): `createHeartbeat` - a checklist-driven periodic agent beat with empty-checklist skip (zero model calls), busy-deferral (retry cadence + give-up cap), active-hours windows (IANA tz, midnight-crossing), sentinel suppression (`HEARTBEAT_OK`) with a minimum-length noise floor, cheap isolated per-beat profile (fresh session, per-beat run budget, fail-closed model pin) and typed `notify` outcomes from the core escalation ladder. Agent surface additions: public `Agent.isBusy()` (the busy signal behind the deferral) and `AgentCallOptions.pinnedProvider` (per-run fail-closed model pin - wins over `prepareStep` and the preference ladder, never consults the fallback chain; `PreferredModelResolution.source` gains `'pinned'`).

### Patch Changes

- Updated dependencies [[`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`24241a3`](https://github.com/o-stepper/graphorin/commit/24241a3cdb9c684338f02d4d66510c248eb47d7e), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`08cf387`](https://github.com/o-stepper/graphorin/commit/08cf387a4dc5f4cc9b62462a384efe990309e041), [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69), [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69), [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69), [`da7952b`](https://github.com/o-stepper/graphorin/commit/da7952b6b543958838aee8bfab249d24d1061a69), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`7ac0470`](https://github.com/o-stepper/graphorin/commit/7ac0470bdfc579ee864c2ee54e119c94d24ad160), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f), [`9b389be`](https://github.com/o-stepper/graphorin/commit/9b389be2ac436f66d62b3ede9c64cd70808cfe9f)]:
  - @graphorin/core@0.9.0
  - @graphorin/workflow@0.9.0
  - @graphorin/triggers@0.9.0
  - @graphorin/agent@0.9.0
  - @graphorin/sessions@0.9.0
