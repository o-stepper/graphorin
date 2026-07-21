[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / ProactiveTaskFireResult

# Interface: ProactiveTaskFireResult

Defined in: packages/proactive/src/cron-task.ts:78

**`Stable`**

What one fire resolved to.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-escalationblocked"></a> `escalationBlocked?` | `readonly` | [`ProactiveOutcomeKind`](/api/@graphorin/core/type-aliases/ProactiveOutcomeKind.md) | The run tried to escalate above the task's grant; the pending approvals were auto-denied (fail-closed) and nothing was delivered. | packages/proactive/src/cron-task.ts:88 |
| <a id="property-outcome"></a> `outcome?` | `readonly` | [`ProactiveOutcome`](/api/@graphorin/core/type-aliases/ProactiveOutcome.md) | - | packages/proactive/src/cron-task.ts:79 |
| <a id="property-runerror"></a> `runError?` | `readonly` | \{ `code`: `string`; `message`: `string`; \} | The agent run ended `failed` (incl. budget stops). | packages/proactive/src/cron-task.ts:82 |
| `runError.code` | `readonly` | `string` | - | packages/proactive/src/cron-task.ts:82 |
| `runError.message` | `readonly` | `string` | - | packages/proactive/src/cron-task.ts:82 |
| <a id="property-skipped"></a> `skipped?` | `readonly` | [`ProactiveTaskSkipReason`](/api/@graphorin/proactive/type-aliases/ProactiveTaskSkipReason.md) | - | packages/proactive/src/cron-task.ts:80 |
