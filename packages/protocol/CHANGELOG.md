# @graphorin/protocol

## 0.6.0

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

### Minor Changes

- Initial Phase 14b release: Zod schemas + TypeScript types for the
  `graphorin.protocol.v1` WebSocket subprotocol - the discriminated
  unions `ClientMessage` and `ServerMessage`, the JSON-RPC-shaped
  control channel (`initialize` / `subscription.subscribe` /
  `subscription.unsubscribe` / `run.cancel` / `ping`), the typed
  push event frames, the asynchronous server-error frames, the
  subprotocol negotiation helpers, and the close-code taxonomy.
  Browser-friendly: zero Node-only dependencies; only `zod` at
  runtime. Created and maintained by Oleksiy Stepurenko.
