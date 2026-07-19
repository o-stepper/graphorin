[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / ApprovalPauseValue

# Interface: ApprovalPauseValue

Defined in: [packages/core/dist/channels/durable.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/durable.d.ts)

Pause value carried by a persisted-approval suspension.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"graphorin.approval"` | - | [packages/core/dist/channels/durable.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/durable.d.ts) |
| <a id="property-name"></a> `name` | `readonly` | `string` | Caller-chosen name targeted by `workflow.approve(...)`. | [packages/core/dist/channels/durable.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/durable.d.ts) |
| <a id="property-payload"></a> `payload?` | `readonly` | `unknown` | Free-form payload surfaced to the approver (what is being approved). | [packages/core/dist/channels/durable.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/durable.d.ts) |
| <a id="property-timeoutdecision"></a> `timeoutDecision?` | `readonly` | `unknown` | JSON-safe decision delivered when the deadline fires. Defaults to [DEFAULT\_APPROVAL\_TIMEOUT\_DECISION](/api/@graphorin/core/variables/DEFAULT_APPROVAL_TIMEOUT_DECISION.md) (an auto-deny). The timeout VALUE itself (how long to wait) is caller policy. | [packages/core/dist/channels/durable.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/durable.d.ts) |
| <a id="property-wakeat"></a> `wakeAt?` | `readonly` | `number` | Defer-timeout: epoch-ms deadline. An approval carrying one joins the durable-timer enumeration (the suspended checkpoint's `wakeAt` metadata, which the workflow timer daemon already scans); once due, `workflow.tick(threadId)` resolves the approval with [ApprovalPauseValue.timeoutDecision](/api/@graphorin/workflow/interfaces/ApprovalPauseValue.md#property-timeoutdecision) instead of waiting for a human - the auto-deny composition for deferred permission decisions. Absent ⇒ the approval waits indefinitely (the historical behaviour). | [packages/core/dist/channels/durable.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/durable.d.ts) |
