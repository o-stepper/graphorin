[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / reducer

# Function: reducer()

```ts
function reducer<T>(reduce, opts?): Reducer<T>;
```

Defined in: [packages/core/dist/channels/channels.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/channels.d.ts)

**`Stable`**

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

[`Reducer`](/api/@graphorin/workflow/interfaces/Reducer.md)\&lt;`T`\&gt;
