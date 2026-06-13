---
'@graphorin/server': patch
---

fix(server): three P2 hardening fixes (IP-12, IP-18, IP-23)

- **IP-12:** the CSRF cookie was issued with `HttpOnly=false`. RFC 6265 enables
  HttpOnly on the attribute's mere presence (value ignored), so an SPA could
  not read the token for the double-submit echo. The attribute is now omitted.
- **IP-18:** a WebSocket subscription snapshot reported the connection id as
  `tokenId` — diagnostics / audit attributed subscriptions to the connection
  instead of the authenticating principal. The real token id is now carried on
  the subscription record and surfaced in the snapshot.
- **IP-23:** an unauthenticated `/metrics` endpoint leaks operational detail
  (trigger ids in labels, consolidator budgets). The server now warns at start
  when `metrics.requireAuth=false` and it binds a non-loopback host.
