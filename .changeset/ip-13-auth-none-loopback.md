---
'@graphorin/server': minor
---

Make `auth.kind='none'` actually work as the documented trusted-loopback mode (IP-13).

Previously, configuring `auth.kind='none'` produced a server where the auth
middleware was never installed, so `state.auth` stayed `'unauthenticated'` and
**every** domain route (agents, runs, workflows, sessions, memory, skills, mcp,
audit, triggers, replay) was rejected with `401` by the scope middleware — and
`server.ws.enabled: true` was silently ignored because the WebSocket upgrade
required a verifier to mount. The server's own README advertised `'none'` for
"trusted loopback environments", so the advertised mode was dead on arrival.

`auth.kind='none'` now installs an anonymous middleware that stamps a fully
authorized (`admin:*`) principal:

- REST, SSE and replay routes serve without a token.
- The WebSocket upgrade mounts and accepts clients that present only the
  `graphorin.protocol.v1` subprotocol — `ws.enabled` is never silently dropped.
- A startup **warning** fires when `auth.kind='none'` is combined with a
  non-loopback `server.host`, since that exposes full admin access.

New public surface: `createAnonymousAuthMiddleware` (server middleware barrel),
an `'anonymous'` variant on the `AuthState` union, and an optional `anonymous`
flag (plus now-optional `verifier`) on `WsUpgradeOptions`. The
`documentation/guide/standalone-server.md` guide documents the contract.
