[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / HeartbeatBeatResult

# Interface: HeartbeatBeatResult

Defined in: packages/proactive/src/heartbeat.ts:90

**`Stable`**

What one beat resolved to.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-outcome"></a> `outcome?` | `readonly` | [`ProactiveOutcome`](/api/@graphorin/core/type-aliases/ProactiveOutcome.md) | Present when the beat delivered a finding. | packages/proactive/src/heartbeat.ts:92 |
| <a id="property-runerror"></a> `runError?` | `readonly` | \{ `code`: `string`; `message`: `string`; \} | Present when the agent run ended `failed` (incl. budget stops). | packages/proactive/src/heartbeat.ts:96 |
| `runError.code` | `readonly` | `string` | - | packages/proactive/src/heartbeat.ts:96 |
| `runError.message` | `readonly` | `string` | - | packages/proactive/src/heartbeat.ts:96 |
| <a id="property-skipped"></a> `skipped?` | `readonly` | [`HeartbeatSkipReason`](/api/@graphorin/proactive/type-aliases/HeartbeatSkipReason.md) | Present when the beat was skipped. | packages/proactive/src/heartbeat.ts:94 |
