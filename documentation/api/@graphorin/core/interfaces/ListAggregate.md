[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ListAggregate

# Interface: ListAggregate\&lt;T\&gt;

Defined in: [packages/core/src/channels/channels.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L80)

Specialization of `Reducer<T[]>` that appends each write to a list.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-default"></a> `default?` | `readonly` | readonly `T`[] | [packages/core/src/channels/channels.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L82) |
| <a id="property-kind"></a> `kind` | `readonly` | `"list-aggregate"` | [packages/core/src/channels/channels.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L81) |
