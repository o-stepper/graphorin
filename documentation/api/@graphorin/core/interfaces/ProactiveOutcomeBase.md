[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProactiveOutcomeBase

# Interface: ProactiveOutcomeBase

Defined in: packages/core/src/types/proactive.ts:81

**`Stable`**

Fields shared by every rung.

## Extended by

- [`ProactiveActOutcome`](/api/@graphorin/core/interfaces/ProactiveActOutcome.md)
- [`ProactiveNotifyOutcome`](/api/@graphorin/core/interfaces/ProactiveNotifyOutcome.md)
- [`ProactiveQuestionOutcome`](/api/@graphorin/core/interfaces/ProactiveQuestionOutcome.md)
- [`ProactiveReviewOutcome`](/api/@graphorin/core/interfaces/ProactiveReviewOutcome.md)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-firedat"></a> `firedAt` | `readonly` | `string` | ISO-8601 instant of the fire that produced this outcome. | packages/core/src/types/proactive.ts:85 |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | Agent run id behind the outcome, when a run happened. | packages/core/src/types/proactive.ts:93 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | Session the run executed in, when a run happened. | packages/core/src/types/proactive.ts:95 |
| <a id="property-taskid"></a> `taskId` | `readonly` | `string` | Id of the proactive task (heartbeat id, cron task id) that fired. | packages/core/src/types/proactive.ts:83 |
| <a id="property-text"></a> `text` | `readonly` | `string` | The outbound text: the notification body, the question / review context, or the act report. Outbound sanitization happens at the delivery boundary, not here. | packages/core/src/types/proactive.ts:91 |
