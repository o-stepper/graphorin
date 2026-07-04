[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunError

# Interface: RunError

Defined in: packages/core/src/types/run.ts:195

Failure carried by `RunState.error`. The shape mirrors the wire format
used by `agent.error` events.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-code"></a> `code` | `readonly` | `string` | packages/core/src/types/run.ts:197 |
| <a id="property-details"></a> `details?` | `readonly` | `unknown` | packages/core/src/types/run.ts:198 |
| <a id="property-message"></a> `message` | `readonly` | `string` | packages/core/src/types/run.ts:196 |
