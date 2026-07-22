[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / listAggregate

# Function: listAggregate()

```ts
function listAggregate<T>(opts?): ListAggregate<T>;
```

Defined in: [packages/core/dist/channels/channels.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/channels.d.ts)

**`Stable`**

Construct a `ListAggregate` channel.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts?` | \{ `default?`: readonly `T`[]; \} |
| `opts.default?` | readonly `T`[] |

## Returns

[`ListAggregate`](/api/@graphorin/workflow/interfaces/ListAggregate.md)\&lt;`T`\&gt;
