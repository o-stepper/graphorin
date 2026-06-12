---
'@graphorin/mcp': patch
---

fix(mcp): forward `authProvider` / `bearerToken` into the transport with per-request token refresh (MC-2)

`CreateMCPClientOptions.authProvider` was documented as "resolves the bearer header
on every request" and `bearerToken` as its mutually-exclusive fallback, but
**neither was ever read**: `createMCPClient` forwarded eight options and dropped
these two, `buildTransport` only spread the static `config.headers`, and the
`BuiltTransport.resolveAuthHeader?` hook was declared but never set — a dangling
auth seam. Long-lived agent sessions against OAuth-protected MCP servers therefore
died on token expiry while the `@stable` option silently did nothing.

Now `createMCPClient` resolves a live auth source from `authProvider` (preferred)
or `bearerToken`, threads it into `buildTransport`, and the streamable-http / sse
transports install a per-request `fetch`-wrapper that re-resolves the
`Authorization` header on **every** outgoing request. The OAuth provider's
refresh-ahead window now fires per request, so a rotated token reaches the wire on
the next call without re-creating the client. Passing both `authProvider` and
`bearerToken` throws `MCPInvalidConfigError` (the documented mutual exclusion is now
enforced), as does pairing either with the headerless `stdio` transport.

The dead `BuiltTransport.resolveAuthHeader` field and the never-read
`bearerTokenRef` field on the HTTP transport configs are removed.
