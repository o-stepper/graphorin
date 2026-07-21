[**Graphorin API reference v0.13.12**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [openinference](/api/@graphorin/observability/openinference/index.md) / openInferenceKindFor

# Function: openInferenceKindFor()

```ts
function openInferenceKindFor<T>(type): 
  | OpenInferenceSpanKind
  | null;
```

Defined in: packages/observability/src/openinference/index.ts:114

**`Stable`**

Resolve the OpenInference span kind for a Graphorin span type.
Returns `null` for types intentionally excluded from emission.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `T` |

## Returns

  \| [`OpenInferenceSpanKind`](/api/@graphorin/observability/openinference/type-aliases/OpenInferenceSpanKind.md)
  \| `null`
