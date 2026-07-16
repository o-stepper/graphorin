# @graphorin/proactive

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
