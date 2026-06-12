---
'@graphorin/agent': patch
---

feat(agent): structured output is real — `outputType` reaches the wire and validates (AG-3)

`AgentConfig.outputType` was inert: the schema never left the process, no
validation ran, and the final output was a raw `text as unknown as TOutput`
cast — a type lie on the flagship `Agent<TDeps, TOutput>` surface.

- `OutputSpec` gains `jsonSchema` (wire-format JSON Schema). For
  `kind: 'structured'` the runtime forwards `{ kind, description, jsonSchema }`
  on `ProviderRequest.outputType` (the native path adapters consume — PS-24)
  **and** appends one trailing system message instructing JSON-only output with
  the schema embedded — the documented fallback contract that works with every
  adapter today. The instruction lives only in the request copy, never in the
  shared buffer or the persisted `RunState`.
- On the completed path the final text is fence-stripped, `JSON.parse`d and
  validated through `outputType.schema.parse(...)`; failure fails the run with
  the typed `output-validation-failed` code (event + `result.error`) instead of
  silently casting prose to `TOutput`.
- Output guardrails (AG-2) run **after** parsing, so they screen the parsed
  value.
- `outputType.kind: 'text'` with a `schema` is rejected at `createAgent` with
  `InvalidAgentConfigError`; the error docstring now describes the real check.
