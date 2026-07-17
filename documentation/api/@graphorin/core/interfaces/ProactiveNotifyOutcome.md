[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProactiveNotifyOutcome

# Interface: ProactiveNotifyOutcome

Defined in: [packages/core/src/types/proactive.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/proactive.ts#L99)

Fire-and-forget delivery - the default rung.

## Stable

## Extends

- [`ProactiveOutcomeBase`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-firedat"></a> `firedAt` | `readonly` | `string` | ISO-8601 instant of the fire that produced this outcome. | [`ProactiveOutcomeBase`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md).[`firedAt`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md#property-firedat) | [packages/core/src/types/proactive.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/proactive.ts#L85) |
| <a id="property-kind"></a> `kind` | `readonly` | `"notify"` | - | - | [packages/core/src/types/proactive.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/proactive.ts#L100) |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | Agent run id behind the outcome, when a run happened. | [`ProactiveOutcomeBase`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md).[`runId`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md#property-runid) | [packages/core/src/types/proactive.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/proactive.ts#L93) |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | Session the run executed in, when a run happened. | [`ProactiveOutcomeBase`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md).[`sessionId`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md#property-sessionid) | [packages/core/src/types/proactive.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/proactive.ts#L95) |
| <a id="property-taskid"></a> `taskId` | `readonly` | `string` | Id of the proactive task (heartbeat id, cron task id) that fired. | [`ProactiveOutcomeBase`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md).[`taskId`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md#property-taskid) | [packages/core/src/types/proactive.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/proactive.ts#L83) |
| <a id="property-text"></a> `text` | `readonly` | `string` | The outbound text: the notification body, the question / review context, or the act report. Outbound sanitization happens at the delivery boundary, not here. | [`ProactiveOutcomeBase`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md).[`text`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md#property-text) | [packages/core/src/types/proactive.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/proactive.ts#L91) |
