[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / ListAggregate

# Interface: ListAggregate\&lt;T\&gt;

Defined in: [packages/core/dist/channels/channels.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/channels.d.ts)

**`Stable`**

Specialization of `Reducer<T[]>` that appends each write to a list.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-default"></a> `default?` | `readonly` | readonly `T`[] | [packages/core/dist/channels/channels.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/channels.d.ts) |
| <a id="property-kind"></a> `kind` | `readonly` | `"list-aggregate"` | [packages/core/dist/channels/channels.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/channels.d.ts) |
