[**Graphorin API reference v0.15.1**](../../../index.md)

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

**`Stable`**

Take items as long as `pred` returns truthy. The first item for which
`pred` returns falsy ends the stream.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `AsyncIterable`\&lt;`T`\&gt; |
| `pred` | (`value`, `index`) => `boolean` \| `Promise`\&lt;`boolean`\&gt; |
| `signal?` | `AbortSignal` |

## Returns

`AsyncIterable`\&lt;`T`\&gt;
