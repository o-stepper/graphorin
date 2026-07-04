# @graphorin/client

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

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
