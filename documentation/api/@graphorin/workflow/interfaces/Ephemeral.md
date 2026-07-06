[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / Ephemeral

# Interface: Ephemeral\&lt;T\&gt;

Defined in: [packages/core/dist/channels/channels.d.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/channels.d.ts#L93)

Value scoped to a single execution step - discarded when the step
ends.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-default"></a> `default?` | `readonly` | `T` | [packages/core/dist/channels/channels.d.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/channels.d.ts#L95) |
| <a id="property-kind"></a> `kind` | `readonly` | `"ephemeral"` | [packages/core/dist/channels/channels.d.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/channels.d.ts#L94) |
