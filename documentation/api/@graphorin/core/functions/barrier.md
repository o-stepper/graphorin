[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / barrier

# Function: barrier()

```ts
function barrier<T>(from, opts?): Barrier<T>;
```

Defined in: packages/core/src/channels/channels.ts:188

**`Stable`**

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

[`Barrier`](/api/@graphorin/core/interfaces/Barrier.md)\&lt;`T`\&gt;
