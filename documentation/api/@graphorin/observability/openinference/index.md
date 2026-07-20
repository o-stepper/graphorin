[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / openinference

# openinference

OpenInference span-kind emission. Adds the
`openinference.span.kind` attribute (one of `AGENT`, `EVALUATOR`,
`LLM`, `TOOL`, `RETRIEVER`, `EMBEDDING`, `CHAIN`) to applicable
Graphorin spans.

The mapping is the canonical table published in the architecture
documentation. Span types without a clean OpenInference equivalent
(`skill.*`, `mcp.connect`, `mcp.list-tools`, `replay.*`) are NOT
emitted - the caller can introspect via [openInferenceKindFor](/api/@graphorin/observability/openinference/functions/openInferenceKindFor.md)
and decide whether to log a fallback attribute.

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [OpenInferenceSpanKind](/api/@graphorin/observability/openinference/type-aliases/OpenInferenceSpanKind.md) | Canonical OpenInference span-kind enum. |

## Variables

| Variable | Description |
| ------ | ------ |
| [OPEN\_INFERENCE\_EXCLUDED\_TYPES](/api/@graphorin/observability/openinference/variables/OPEN_INFERENCE_EXCLUDED_TYPES.md) | Span types intentionally excluded from OpenInference span-kind emission per the canonical table - `skill.*`, `mcp.connect`, `mcp.list-tools`, and `replay.*` markers do not have a clean OpenInference equivalent. |
| [OPEN\_INFERENCE\_KIND\_TABLE](/api/@graphorin/observability/openinference/variables/OPEN_INFERENCE_KIND_TABLE.md) | Full canonical span-to-kind table - exposed for tooling and tests that need to introspect the mapping. |

## Functions

| Function | Description |
| ------ | ------ |
| [emitOpenInferenceKind](/api/@graphorin/observability/openinference/functions/emitOpenInferenceKind.md) | Attach the `openinference.span.kind` attribute to a span. No-op for span types that lack a clean OpenInference equivalent. The attribute is tagged `'public'` because the enum value is bounded and contains no PII. |
| [openInferenceKindFor](/api/@graphorin/observability/openinference/functions/openInferenceKindFor.md) | Resolve the OpenInference span kind for a Graphorin span type. Returns `null` for types intentionally excluded from emission. |
