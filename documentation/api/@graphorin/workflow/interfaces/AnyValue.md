[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / AnyValue

# Interface: AnyValue\<T\>

Defined in: packages/core/dist/channels/channels.d.ts:41

Overwrite-on-write - collisions are silently allowed (last-write-wins
semantics within a step).

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-default"></a> `default?` | `readonly` | `T` | packages/core/dist/channels/channels.d.ts:43 |
| <a id="property-kind"></a> `kind` | `readonly` | `"any-value"` | packages/core/dist/channels/channels.d.ts:42 |
