[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / adaptTokenCounter

# Function: adaptTokenCounter()

```ts
function adaptTokenCounter(counter): ContextTokenCounter;
```

Defined in: packages/memory/src/context-engine/token-counter.ts:54

Wrap a real [TokenCounter](/api/@graphorin/core/interfaces/TokenCounter.md) into the narrower
[ContextTokenCounter](/api/@graphorin/memory/interfaces/ContextTokenCounter.md) surface. Calls `countText(text)`
directly for max precision; falls back to the synthetic
single-message bridge when only `count(messages)` is supported.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `counter` | [`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md) |

## Returns

[`ContextTokenCounter`](/api/@graphorin/memory/interfaces/ContextTokenCounter.md)

## Stable
