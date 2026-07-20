[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / filter

# Function: filter()

```ts
function filter<T>(
   source, 
   pred, 
signal?): AsyncIterable<T>;
```

Defined in: packages/core/src/utils/streams.ts:55

**`Stable`**

Filter values produced by `source`. The predicate may be async.

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
