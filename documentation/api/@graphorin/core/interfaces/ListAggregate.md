[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ListAggregate

# Interface: ListAggregate\<T\>

Defined in: packages/core/src/channels/channels.ts:80

Specialization of `Reducer<T[]>` that appends each write to a list.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-default"></a> `default?` | `readonly` | readonly `T`[] | packages/core/src/channels/channels.ts:82 |
| <a id="property-kind"></a> `kind` | `readonly` | `"list-aggregate"` | packages/core/src/channels/channels.ts:81 |
