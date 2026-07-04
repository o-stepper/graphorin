---
'@graphorin/server': patch
'@graphorin/client': patch
'@graphorin/triggers': patch
'@graphorin/embedder-transformersjs': patch
---

Server / client / periphery correctness (audit 2026-07-04 Wave B, cluster B6).

- periphery-01: `POST /v1/workflows/:id/resume` actually resumes - it background-iterates `workflow.resume(threadId, {resume})` and emits every event on the `workflow:<id>/runs/<runId>/events` subject (mirroring execute); the fictional unmounted SSE URL is gone and the run completes. `POST /v1/workflows/:id/fork` returns an honest 501 instead of a 202 that forked nothing.
- periphery-02: `standalone-server.md` now states plainly that `graphorin start` serves health/metrics/tokens/tickets/WS-SSE only and that the domain routes mount only when adapters are composed programmatically via `createServer({...})`.
- periphery-03: the client SSE fallback survives reconnects - `#reconnect` no longer attempts the RPC resubscribe on the read-only SSE transport (which threw and permanently killed the subscription); the reconnect carries the subscription's cursor as a `Last-Event-ID` header so the server replays only missed events; a closed bound subscription is recreated on the next `subscribe()`.
- periphery-08: the idempotency middleware tracks in-flight keyed executions - a concurrent duplicate gets `409 idempotency-in-flight` + `Retry-After` instead of double-executing (per draft-ietf-httpapi-idempotency-key-header).
- periphery-09: `subscribe({ target: 'run' })` without `sessionId` throws a clear client-side error instead of building a `run:` subject the server grammar can never accept.
- periphery-10: session-stream subjects gate on `sessions:read:<sessionId>` (read-only streams, sessionId resource slot) instead of `agents:invoke:<sessionId>`, aligning with the SSE route's requirement.
- periphery-11: interval triggers under `catchupPolicy: 'none'` advance to the next FUTURE boundary after downtime instead of firing immediately on restart; `recordActivity()` no longer arms idle timers on a stopped scheduler (P-14).
- periphery-05: the TransformersJS embedder throws for an unknown model with no `dim` hint (the PS-11 fix ported from the Ollama embedder) instead of assuming 768 - a wrong assumed width baked a wrong-width id + vec0 table and the id changed after the first embed; a width drift against a bound dim now throws too.
- P-05: the WS upgrade bearer verification passes the client IP so the per-IP failure lockout engages for upgrade attempts (previously a lockout-free brute-force surface).
- Docs: the fictional "disconnect policy" section replaced with the real reconnect-and-replay behaviour; the WS ticket endpoint path corrected to `/v1/session/ws-ticket`.
