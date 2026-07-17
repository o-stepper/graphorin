---
'@graphorin/server': minor
'@graphorin/store-sqlite': minor
'@graphorin/agent': minor
---

Durable suspended agent runs (migration 038): a run parked on durable HITL (`awaiting_approval`) now survives a server restart. The `RunStateTracker` mirrors every park into the new `store.suspendedRuns` sidecar (`suspended_runs` table, session-scoped for the erasure cascade), boot hydration re-registers persisted parks, and `POST /runs/:runId/resume` rehydrates them through the owning agent's new `serializeState` / `deserializeState` codec (version-stamped, binary-safe, secret-redacted - the `Agent` interface gains both methods). Rows are dropped when the run settles (resume completes/fails, or an explicit `POST /runs/:runId/abort`); the graceful-shutdown force-abort deliberately keeps them. Custom `ServerAgentLike` fixtures without the codec keep today's in-memory behaviour and the resume endpoint answers an actionable `409 run-state-unavailable`; an unreadable durable payload answers `500 run-state-invalid`.
