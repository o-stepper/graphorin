---
'@graphorin/core': minor
'@graphorin/protocol': patch
'@graphorin/server': patch
---

W-046: JSON-safe `WireAgentEvent` projection for all binary-bearing event variants, applied on the server WS path.

`@graphorin/core` gains `WireFileGeneratedEvent`, `WireToolExecutePartialEvent`, `WireAgentEndEvent` (whose `result.state` is the `WireRunState` projection) plus the `WireAgentEvent` union and pure `toWireAgentEvent`/`fromWireAgentEvent` codecs. The `AgentEvent` TSDoc now documents the real two-layer wire contract (envelope `{eventId, subject, type, payload}` with `payload = WireAgentEvent`) instead of the false claim that `@graphorin/protocol` re-exports the union; protocol stays zod-only with a doc pointer. The server's `backgroundStreamAgent` projects every streamed event before emitting, so `file.generated`, binary `tool.execute.partial` chunks and a multimodal `agent.end` state arrive at WS clients decodable instead of as numeric-key mush. An exhaustive `Record<AgentEvent['type'], ...>` fixture gate in core forces a wire decision for every future event variant.
