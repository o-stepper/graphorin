[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / take

# Function: take()

```ts
function take<T>(
   source, 
   n, 
signal?): AsyncIterable<T>;
```

Defined in: [packages/core/src/utils/streams.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/streams.ts#L71)

Take the first `n` items.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `AsyncIterable`\&lt;`T`\&gt; |
| `n` | `number` |
| `signal?` | `AbortSignal` |

## Returns

`AsyncIterable`\&lt;`T`\&gt;

## Stable
