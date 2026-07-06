[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / mapStream

# Function: mapStream()

```ts
function mapStream<T, U>(
   source, 
   fn, 
signal?): AsyncIterable<U>;
```

Defined in: packages/core/src/utils/streams.ts:39

Map every value of an async iterable. The mapper may be async.
Cancellation via `signal` is honored.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `U` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `AsyncIterable`\<`T`\> |
| `fn` | (`value`, `index`) => `U` \| `Promise`\<`U`\> |
| `signal?` | `AbortSignal` |

## Returns

`AsyncIterable`\<`U`\>

## Stable
