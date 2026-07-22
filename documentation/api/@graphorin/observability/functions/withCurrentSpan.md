[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / withCurrentSpan

# Function: withCurrentSpan()

```ts
function withCurrentSpan<R>(span, fn): R | Promise<R>;
```

Defined in: packages/observability/src/logger/logger.ts:63

**`Stable`**

Run `fn` with the supplied span as the "current" log-correlation
span. The logger picks up the trace + span ids automatically.

## Type Parameters

| Type Parameter |
| ------ |
| `R` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `span` | \| [`AISpan`](/api/@graphorin/core/interfaces/AISpan.md)\&lt;[`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md)\&gt; \| `undefined` |
| `fn` | () => `R` \| `Promise`\&lt;`R`\&gt; |

## Returns

`R` \| `Promise`\&lt;`R`\&gt;
