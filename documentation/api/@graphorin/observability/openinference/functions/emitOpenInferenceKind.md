[**Graphorin API reference v0.13.6**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [openinference](/api/@graphorin/observability/openinference/index.md) / emitOpenInferenceKind

# Function: emitOpenInferenceKind()

```ts
function emitOpenInferenceKind<T>(span): void;
```

Defined in: packages/observability/src/openinference/index.ts:126

**`Stable`**

Attach the `openinference.span.kind` attribute to a span. No-op for
span types that lack a clean OpenInference equivalent. The attribute
is tagged `'public'` because the enum value is bounded and contains
no PII.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `span` | [`AISpan`](/api/@graphorin/core/interfaces/AISpan.md)\&lt;`T`\&gt; |

## Returns

`void`
