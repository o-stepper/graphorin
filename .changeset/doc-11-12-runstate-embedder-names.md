---
'@graphorin/agent': patch
---

Correct stale API names in docs + agent doc-comments (DOC-11/12).

The docs (and the agent package's own TSDoc / error text) referred to APIs that
don't exist:

- **DOC-12**: durable-HITL serialization was written as `RunState.toJSON()` /
  `RunState.fromJSON(serialized, agent)` — methods on a plain data interface,
  with a phantom `agent` second argument. The real API is the standalone
  `runStateToJSON(state)` / `runStateFromJSON(serialized)`. Fixed across the
  guide + glossary, the agent barrel/error TSDoc (which generates the API docs),
  and one `AgentResolutionError` message that printed the wrong name.
- **DOC-11** (docs only): `createTransformersEmbedder(...)` → the real export
  `createTransformersJsEmbedder(...)`, and the embedder identity method
  `embedderId()` → the contract's `id()`.
