[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / withSignal

# Function: withSignal()

```ts
function withSignal<T>(source, signal?): AsyncIterable<T>;
```

Defined in: packages/core/src/utils/streams.ts:191

Wrap `source` with abort-signal propagation: when `signal` aborts the
underlying iterator's `return()` is called and the loop exits cleanly.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `AsyncIterable`\&lt;`T`\&gt; |
| `signal?` | `AbortSignal` |

## Returns

`AsyncIterable`\&lt;`T`\&gt;

## Stable
