[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / ListAggregate

# Interface: ListAggregate\&lt;T\&gt;

Defined in: packages/core/dist/channels/channels.d.ts:62

Specialization of `Reducer<T[]>` that appends each write to a list.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-default"></a> `default?` | `readonly` | readonly `T`[] | packages/core/dist/channels/channels.d.ts:64 |
| <a id="property-kind"></a> `kind` | `readonly` | `"list-aggregate"` | packages/core/dist/channels/channels.d.ts:63 |
