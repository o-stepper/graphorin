[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / asGraphorinSpan

# Function: asGraphorinSpan()

```ts
function asGraphorinSpan<T>(span): 
  | GraphorinSpan<T>
  | null;
```

Defined in: packages/observability/src/tracer/tracer.ts:322

**`Stable`**

Returns the underlying [GraphorinSpan](/api/@graphorin/observability/interfaces/GraphorinSpan.md) when `span` is a Graphorin
span. Useful when callers want to reach the per-attribute sensitivity
helper from a generic `AISpan<T>`.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `span` | [`AISpan`](/api/@graphorin/core/interfaces/AISpan.md)\&lt;`T`\&gt; |

## Returns

  \| [`GraphorinSpan`](/api/@graphorin/observability/interfaces/GraphorinSpan.md)\&lt;`T`\&gt;
  \| `null`
