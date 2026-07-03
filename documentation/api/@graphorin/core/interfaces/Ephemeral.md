[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Ephemeral

# Interface: Ephemeral\&lt;T\&gt;

Defined in: packages/core/src/channels/channels.ts:114

Value scoped to a single execution step — discarded when the step
ends.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-default"></a> `default?` | `readonly` | `T` | packages/core/src/channels/channels.ts:116 |
| <a id="property-kind"></a> `kind` | `readonly` | `"ephemeral"` | packages/core/src/channels/channels.ts:115 |
