[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / reducer

# Function: reducer()

```ts
function reducer<T>(reduce, opts?): Reducer<T>;
```

Defined in: packages/core/dist/channels/channels.d.ts:118

Construct a `Reducer` channel.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `reduce` | (`prev`, `next`) => `T` |
| `opts?` | \{ `default?`: `T`; \} |
| `opts.default?` | `T` |

## Returns

[`Reducer`](/api/@graphorin/workflow/interfaces/Reducer.md)\<`T`\>

## Stable
