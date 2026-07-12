---
'@graphorin/server': minor
'@graphorin/proactive': minor
'@graphorin/client': minor
---

Escalation-ladder routing + server agent-HITL resume (closes the W-119 residual). `POST /v1/runs/:runId/resume` now resumes in-process suspensions for real: the run tracker gains `'awaiting_approval'` status with retained resumable `RunState` (`suspend`/`registerSuspended`/`suspendedStateOf`; exempt from retention pruning, cleared on settle/abort), the `/agents/:id/run` route parks suspended results instead of mislabeling them completed, and the resume body is a strict `{ approvals: [...] }` (409 for not-suspended / state-unavailable / agent-busy). `@graphorin/proactive` adds the routing layer: `outcomeToDelivery` (structural mirror of the channels `DeliveryPayload`, pinned compatible by test), `workflowAwakeableOutcome` (awakeable-parked question/review with the D-1 `wf:` ref), and the `suspendedRuns` messenger bridge on cron tasks (registers parked fires with the server tracker under `registryAgentId`, default `proactive-<id>` - avoid ':' in registry ids, it is the scope-segment separator). The client SDK's `resume(...)` now posts the directive as the body (the old `{ directive }` wrapper targeted the retired 501).
