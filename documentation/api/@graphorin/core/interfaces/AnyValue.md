[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AnyValue

# Interface: AnyValue\&lt;T\&gt;

Defined in: packages/core/src/channels/channels.ts:57

**`Stable`**

Overwrite-on-write - collisions are silently allowed (last-write-wins
semantics within a step).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-default"></a> `default?` | `readonly` | `T` | packages/core/src/channels/channels.ts:59 |
| <a id="property-kind"></a> `kind` | `readonly` | `"any-value"` | packages/core/src/channels/channels.ts:58 |
