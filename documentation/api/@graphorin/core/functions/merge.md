[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / merge

# Function: merge()

```ts
function merge<T>(sources, signal?): AsyncIterable<T>;
```

Defined in: packages/core/src/utils/streams.ts:109

**`Stable`**

Merge multiple async iterables into a single output iterable. Items
are yielded in the order they arrive (interleaved), not in source
order. Cancellation propagates to every upstream iterator.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `sources` | readonly `AsyncIterable`\&lt;`T`, `any`, `any`\&gt;[] |
| `signal?` | `AbortSignal` |

## Returns

`AsyncIterable`\&lt;`T`\&gt;
