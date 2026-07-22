---
'@graphorin/server': minor
---

`POST /v1/agents/:id/run` now answers `409` with `error: 'agent-busy'` when the target agent instance already has a run in flight (the mapping `POST /v1/runs/:runId/resume` always had), instead of `500 run-failed`. A busy single-flight instance is client-addressable contention - pace, retry, or target another instance from a pool - not a server fault. Found by the new soak leg driving one instance concurrently.
