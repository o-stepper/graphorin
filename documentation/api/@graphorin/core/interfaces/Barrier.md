[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Barrier

# Interface: Barrier\&lt;T\&gt;

Defined in: [packages/core/src/channels/channels.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L102)

Barrier - completes when every writer in `from` has produced a value.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-default"></a> `default?` | `readonly` | `T` | [packages/core/src/channels/channels.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L105) |
| <a id="property-from"></a> `from` | `readonly` | readonly `string`[] | [packages/core/src/channels/channels.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L104) |
| <a id="property-kind"></a> `kind` | `readonly` | `"barrier"` | [packages/core/src/channels/channels.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/channels.ts#L103) |
