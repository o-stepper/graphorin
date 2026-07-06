[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / filter

# Function: filter()

```ts
function filter<T>(
   source, 
   pred, 
signal?): AsyncIterable<T>;
```

Defined in: [packages/core/src/utils/streams.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/streams.ts#L55)

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

## Stable
