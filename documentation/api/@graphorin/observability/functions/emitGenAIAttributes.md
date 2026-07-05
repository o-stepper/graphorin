[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / emitGenAIAttributes

# Function: emitGenAIAttributes()

```ts
function emitGenAIAttributes<T>(span, attrs): void;
```

Defined in: packages/observability/src/gen-ai/emit.ts:55

Attach the canonical `gen_ai.*` attribute set to a span. The helper
is additive on the existing Graphorin-prefixed attributes and applies
the per-attribute sensitivity defaults catalogue.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `span` | [`AISpan`](/api/@graphorin/core/interfaces/AISpan.md)\&lt;`T`\&gt; |
| `attrs` | [`GenAIAttributes`](/api/@graphorin/observability/interfaces/GenAIAttributes.md) |

## Returns

`void`

## Stable
