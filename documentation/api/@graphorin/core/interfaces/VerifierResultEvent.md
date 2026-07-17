[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / VerifierResultEvent

# Interface: VerifierResultEvent

Defined in: [packages/core/src/types/agent-event.ts:311](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L311)

Outcome of a terminal-response verifier check (C3). Emitted once per
verifier per verification round; a failed verifier's `feedback` is
also appended to the transcript so the model can address it.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-feedback"></a> `feedback?` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:315](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L315) |
| <a id="property-ok"></a> `ok` | `readonly` | `boolean` | [packages/core/src/types/agent-event.ts:314](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L314) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:316](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L316) |
| <a id="property-type"></a> `type` | `readonly` | `"verifier.result"` | [packages/core/src/types/agent-event.ts:312](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L312) |
| <a id="property-verifierid"></a> `verifierId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:313](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L313) |
