[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / VerifierResultEvent

# Interface: VerifierResultEvent

Defined in: packages/core/src/types/agent-event.ts:284

Outcome of a terminal-response verifier check (C3). Emitted once per
verifier per verification round; a failed verifier's `feedback` is
also appended to the transcript so the model can address it.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-feedback"></a> `feedback?` | `readonly` | `string` | packages/core/src/types/agent-event.ts:288 |
| <a id="property-ok"></a> `ok` | `readonly` | `boolean` | packages/core/src/types/agent-event.ts:287 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | packages/core/src/types/agent-event.ts:289 |
| <a id="property-type"></a> `type` | `readonly` | `"verifier.result"` | packages/core/src/types/agent-event.ts:285 |
| <a id="property-verifierid"></a> `verifierId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:286 |
