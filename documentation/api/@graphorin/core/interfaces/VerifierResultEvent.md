[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / VerifierResultEvent

# Interface: VerifierResultEvent

Defined in: [packages/core/src/types/agent-event.ts:304](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L304)

Outcome of a terminal-response verifier check (C3). Emitted once per
verifier per verification round; a failed verifier's `feedback` is
also appended to the transcript so the model can address it.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-feedback"></a> `feedback?` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:308](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L308) |
| <a id="property-ok"></a> `ok` | `readonly` | `boolean` | [packages/core/src/types/agent-event.ts:307](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L307) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:309](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L309) |
| <a id="property-type"></a> `type` | `readonly` | `"verifier.result"` | [packages/core/src/types/agent-event.ts:305](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L305) |
| <a id="property-verifierid"></a> `verifierId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:306](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L306) |
