[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunError

# Interface: RunError

Defined in: packages/core/src/types/run.ts:273

Failure carried by `RunState.error`. The shape mirrors the wire format
used by `agent.error` events.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-code"></a> `code` | `readonly` | `string` | packages/core/src/types/run.ts:275 |
| <a id="property-details"></a> `details?` | `readonly` | `unknown` | packages/core/src/types/run.ts:276 |
| <a id="property-message"></a> `message` | `readonly` | `string` | packages/core/src/types/run.ts:274 |
