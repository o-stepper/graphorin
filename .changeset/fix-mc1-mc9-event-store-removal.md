---
'@graphorin/mcp': minor
---

fix(mcp): remove the misdesigned client eventStore; honest session semantics (MC-1, MC-9)

- **MC-1**: the `eventStore` client option (and the `InMemoryEventStore` /
  `EventStore` exports + `@graphorin/mcp/event-store` sub-path) are removed.
  The option was never wired — and could not work: per the Streamable HTTP
  spec, event replay is the SERVER's responsibility; the SDK transport
  already auto-reconnects with `Last-Event-ID` on its own. Passing the
  legacy option now logs a warning instead of silently doing nothing.
  The README's "resumable streaming sessions" story is rewritten to match.
- **MC-9**: `MCPClient.resumable` conflated "server assigned a session id"
  with "supports resumable replay". The honest field is the new
  `sessionIdPresent` (stateful routing detected — not a replay guarantee);
  `resumable` remains as a deprecated alias with the same value, and the
  INFO log is now `mcp.session.session-id.resolved` with source
  `'session-id-present'`.
