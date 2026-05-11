# @graphorin/protocol

## 0.1.0

### Minor Changes

- Initial Phase 14b release: Zod schemas + TypeScript types for the
  `graphorin.protocol.v1` WebSocket subprotocol — the discriminated
  unions `ClientMessage` and `ServerMessage`, the JSON-RPC-shaped
  control channel (`initialize` / `subscription.subscribe` /
  `subscription.unsubscribe` / `run.cancel` / `ping`), the typed
  push event frames, the asynchronous server-error frames, the
  subprotocol negotiation helpers, and the close-code taxonomy.
  Browser-friendly: zero Node-only dependencies; only `zod` at
  runtime. Created and maintained by Oleksiy Stepurenko.
