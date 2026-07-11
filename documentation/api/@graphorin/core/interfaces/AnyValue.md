[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AnyValue

# Interface: AnyValue\&lt;T\&gt;

Defined in: [packages/core/src/channels/channels.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L57)

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
| <a id="property-default"></a> `default?` | `readonly` | `T` | [packages/core/src/channels/channels.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L59) |
| <a id="property-kind"></a> `kind` | `readonly` | `"any-value"` | [packages/core/src/channels/channels.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L58) |
