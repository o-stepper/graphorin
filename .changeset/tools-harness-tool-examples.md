---
'@graphorin/core': minor
'@graphorin/agent': minor
---

Render tool `examples` into the provider request and document response-budget
and pagination conventions (WI-06 / P2-3).

- **`toolToDefinition` no longer drops `examples`.** When a tool declares
  worked `examples` and they are eagerly rendered, the agent now projects them
  onto the emitted `ToolDefinition` so the provider can fold them into the
  model-facing tool description. The `defer_loading` auto-rule is respected: the
  registry resolves `examplesEagerlyRendered` to `false` for deferred tools, so
  a deferred tool keeps its examples out of context even after `tool_search`
  promotes it (WI-05); a plain eager tool (neither flag set) renders by default;
  `examplesEagerlyRendered: false` opts out explicitly. Rendered examples are
  bounded to ≤5 — the registry only WARNs on overflow, so the runtime enforces
  the `ToolExample` `[1, 5]` contract defensively.
- **`@graphorin/core` `ToolDefinition` gains an optional `examples` field**
  (additive) plus a new exported `ToolDefinitionExample` type — a serializable,
  schema-agnostic `{ input, output, comment? }` projection of `ToolExample`.
  Existing providers are unaffected; they may opt in to rendering it.

Also documented in `documentation/guide/tools.md`: the worked-examples rendering
rule, a `limit`/`cursor` → `nextCursor` pagination convention for high-volume
tools, and the `maxResultTokens` default (16384) versus the ~25k norm. Making
the truncation budget provider-aware via the token counter is noted as a
follow-up (it belongs with first-class context management).
