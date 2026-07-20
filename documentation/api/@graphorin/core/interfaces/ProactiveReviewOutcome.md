[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProactiveReviewOutcome

# Interface: ProactiveReviewOutcome

Defined in: packages/core/src/types/proactive.ts:124

**`Stable`**

The task proposes an action and parks until the user approves or
rejects it - same resolve plumbing as `question`, different intent:
nothing has happened yet.

## Extends

- [`ProactiveOutcomeBase`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-firedat"></a> `firedAt` | `readonly` | `string` | ISO-8601 instant of the fire that produced this outcome. | [`ProactiveOutcomeBase`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md).[`firedAt`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md#property-firedat) | packages/core/src/types/proactive.ts:85 |
| <a id="property-kind"></a> `kind` | `readonly` | `"review"` | - | - | packages/core/src/types/proactive.ts:125 |
| <a id="property-options"></a> `options?` | `readonly` | readonly [`ProactiveOutcomeOption`](/api/@graphorin/core/interfaces/ProactiveOutcomeOption.md)[] | - | - | packages/core/src/types/proactive.ts:127 |
| <a id="property-ref"></a> `ref` | `readonly` | `string` | - | - | packages/core/src/types/proactive.ts:126 |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | Agent run id behind the outcome, when a run happened. | [`ProactiveOutcomeBase`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md).[`runId`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md#property-runid) | packages/core/src/types/proactive.ts:93 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | Session the run executed in, when a run happened. | [`ProactiveOutcomeBase`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md).[`sessionId`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md#property-sessionid) | packages/core/src/types/proactive.ts:95 |
| <a id="property-taskid"></a> `taskId` | `readonly` | `string` | Id of the proactive task (heartbeat id, cron task id) that fired. | [`ProactiveOutcomeBase`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md).[`taskId`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md#property-taskid) | packages/core/src/types/proactive.ts:83 |
| <a id="property-text"></a> `text` | `readonly` | `string` | The outbound text: the notification body, the question / review context, or the act report. Outbound sanitization happens at the delivery boundary, not here. | [`ProactiveOutcomeBase`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md).[`text`](/api/@graphorin/core/interfaces/ProactiveOutcomeBase.md#property-text) | packages/core/src/types/proactive.ts:91 |
