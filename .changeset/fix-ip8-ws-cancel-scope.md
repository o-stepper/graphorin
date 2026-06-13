---
'@graphorin/server': patch
---

fix(server): enforce agents:invoke scope on WS run cancellation (IP-8)

The WebSocket `run.cancel` request and the `notifications/cancelled`
notification called `runs.abort(runId)` with **no scope check**, so any valid
bearer token could abort any in-flight run — while the REST equivalent
(`POST /runs/:runId/abort`) is gated by `agents:invoke`. The
`notifications/cancelled` path also ran before the `initialize` gate.

Both handlers now require `agents:invoke` (wildcard-aware via `scopeMatches`,
mirroring the REST gate): `run.cancel` without it is rejected with
`SCOPE_DENIED` (`-32003`); `notifications/cancelled` without it — or before
`initialize` — is silently ignored (a notification carries no id to reply on).
Red-first tests drive the upgrade handler directly. `standalone-server.md`
documents the WS scope requirement.
