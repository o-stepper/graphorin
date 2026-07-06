[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / barrier

# Function: barrier()

```ts
function barrier<T>(from, opts?): Barrier<T>;
```

Defined in: [packages/core/dist/channels/channels.d.ts:143](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/channels.d.ts#L143)

Construct a `Barrier` channel.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | readonly `string`[] |
| `opts?` | \{ `default?`: `T`; \} |
| `opts.default?` | `T` |

## Returns

[`Barrier`](/api/@graphorin/workflow/interfaces/Barrier.md)\&lt;`T`\&gt;

## Stable
