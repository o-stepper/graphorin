[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / Barrier

# Interface: Barrier\&lt;T\&gt;

Defined in: [packages/core/dist/channels/channels.d.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/channels.d.ts#L82)

Barrier - completes when every writer in `from` has produced a value.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-default"></a> `default?` | `readonly` | `T` | [packages/core/dist/channels/channels.d.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/channels.d.ts#L85) |
| <a id="property-from"></a> `from` | `readonly` | readonly `string`[] | [packages/core/dist/channels/channels.d.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/channels.d.ts#L84) |
| <a id="property-kind"></a> `kind` | `readonly` | `"barrier"` | [packages/core/dist/channels/channels.d.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/channels.d.ts#L83) |
