---
'@graphorin/server': minor
---

Server e2e remediation cluster (2026-07-11):

- E-02 (S-15/8): the WebSocket subscribe RPC reply now reaches the wire BEFORE any replayed frames. `WsDispatcher.subscribe` accepts `deferReplay: true` and the ok result exposes an idempotent `dispatchReplay()`, so the upgrade handler acknowledges the subscription first and then delivers the captured replay in buffer order (lastEventId semantics unchanged). Previously clients that key their subscription map off the reply dropped every replayed frame on fresh subscribe and reconnect-resume.
- E-03 (S-14b/17): `/v1/metrics` mounts AFTER the auth middleware, so `metrics.requireAuth = true` finally works - a bearer with `admin:metrics:read` (or `admin:*`) gets 200, no token gets 401, wrong scope gets 403. The `requireAuth = false` path stays unauthenticated via the existing middleware skip list.
- E-11 (S-09/4): `GET /v1/workflows/:id/state` maps workflow errors through the wire envelope like tick does - an unknown or deleted thread answers `404 {"error":"thread-not-found"}` instead of escaping as a plain-text 500.
- E-21 (S-24/16): `stop()` only closes stores the server created itself. A caller-injected `createServer({ store })` store stays open so it can be shared across restarts (the documented restartFactory pattern); `ServerLifecycleDeps` gains an `ownsStore` flag.
- S-09 (minor): `/v1/health` clamps `walSizeBytes` to 0 when the database is not in WAL journal mode (SQLite reports log=-1, which surfaced as -4096); the `graphorin_storage_wal_size_bytes` gauge is clamped the same way.
