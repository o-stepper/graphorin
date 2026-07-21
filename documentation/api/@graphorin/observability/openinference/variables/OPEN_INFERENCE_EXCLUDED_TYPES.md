[**Graphorin API reference v0.13.12**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [openinference](/api/@graphorin/observability/openinference/index.md) / OPEN\_INFERENCE\_EXCLUDED\_TYPES

# Variable: OPEN\_INFERENCE\_EXCLUDED\_TYPES

```ts
const OPEN_INFERENCE_EXCLUDED_TYPES: ReadonlyArray<SpanType>;
```

Defined in: packages/observability/src/openinference/index.ts:99

**`Stable`**

Span types intentionally excluded from OpenInference span-kind
emission per the canonical table - `skill.*`, `mcp.connect`,
`mcp.list-tools`, and `replay.*` markers do not have a clean
OpenInference equivalent.
