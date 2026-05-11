# @graphorin/client

## 0.1.0

### Minor Changes

- Initial Phase 14b release: reference TypeScript client for the
  Graphorin standalone server. Wraps the `graphorin.protocol.v1`
  WebSocket subprotocol (with an optional SSE fallback for
  proxy-restricted environments) behind an ergonomic
  `GraphorinClient` class: `connect()`, `subscribe({ target, id })`
  returning an async-iterable subscription, `cancel(runId, opts)`,
  `resume(runId, directive)`, `ping()`, `disconnect()`. Handles the
  browser ticket flow, exponential-backoff reconnect with replay
  buffer resume, and Zod-validated frame parsing on both
  directions. Browser-friendly: zero Node-only dependencies. Created
  and maintained by Oleksiy Stepurenko.
