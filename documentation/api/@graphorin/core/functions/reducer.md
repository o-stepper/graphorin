[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / reducer

# Function: reducer()

```ts
function reducer<T>(reduce, opts?): Reducer<T>;
```

Defined in: [packages/core/src/channels/channels.ts:146](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L146)

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

[`Reducer`](/api/@graphorin/core/interfaces/Reducer.md)\&lt;`T`\&gt;

## Stable
