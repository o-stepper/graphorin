[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / takeWhile

# Function: takeWhile()

```ts
function takeWhile<T>(
   source, 
   pred, 
signal?): AsyncIterable<T>;
```

Defined in: packages/core/src/utils/streams.ts:90

Take items as long as `pred` returns truthy. The first item for which
`pred` returns falsy ends the stream.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `AsyncIterable`\<`T`\> |
| `pred` | (`value`, `index`) => `boolean` \| `Promise`\<`boolean`\> |
| `signal?` | `AbortSignal` |

## Returns

`AsyncIterable`\<`T`\>

## Stable
