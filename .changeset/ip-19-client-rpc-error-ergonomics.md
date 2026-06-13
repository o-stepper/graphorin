---
'@graphorin/client': minor
---

Discriminate RPC failures and stop swallowing abnormal subscription teardown (IP-19).

- A server `RpcFailure` frame now maps its JSON-RPC error code to a dedicated
  `GraphorinClientErrorKind` via the new exported `kindForRpcCode` helper, so a
  rate-limited (`'rate-limited'`), scope-denied (`'scope-denied'`),
  auth (`'auth-failed'`), run-not-found (`'run-not-found'`),
  subscription-not-found (`'subscription-not-found'`) or internal
  (`'server-error'`) failure is distinguishable from a generic
  `'protocol-violation'` instead of every RPC error collapsing to the latter.
- A subscription event iterator parked in `next()` now **rejects** with the
  teardown error (e.g. `ClientAbortedError` on `disconnect()`, or a
  `TransportFailedError` on an abnormal transport close) instead of silently
  resolving `{ done: true }` and swallowing the failure — matching the outcome a
  fresh `next()` call already produced after close.
