[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ApprovalPauseValue

# Interface: ApprovalPauseValue

Defined in: [packages/core/src/channels/durable.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L52)

Pause value carried by a persisted-approval suspension.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"graphorin.approval"` | - | [packages/core/src/channels/durable.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L53) |
| <a id="property-name"></a> `name` | `readonly` | `string` | Caller-chosen name targeted by `workflow.approve(...)`. | [packages/core/src/channels/durable.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L55) |
| <a id="property-payload"></a> `payload?` | `readonly` | `unknown` | Free-form payload surfaced to the approver (what is being approved). | [packages/core/src/channels/durable.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L57) |
| <a id="property-timeoutdecision"></a> `timeoutDecision?` | `readonly` | `unknown` | JSON-safe decision delivered when the deadline fires. Defaults to [DEFAULT\_APPROVAL\_TIMEOUT\_DECISION](/api/@graphorin/core/variables/DEFAULT_APPROVAL_TIMEOUT_DECISION.md) (an auto-deny). The timeout VALUE itself (how long to wait) is caller policy. | [packages/core/src/channels/durable.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L74) |
| <a id="property-wakeat"></a> `wakeAt?` | `readonly` | `number` | E1 defer-timeout: epoch-ms deadline. An approval carrying one joins the durable-timer enumeration (the suspended checkpoint's `wakeAt` metadata, which the workflow timer daemon already scans); once due, `workflow.tick(threadId)` resolves the approval with [ApprovalPauseValue.timeoutDecision](/api/@graphorin/core/interfaces/ApprovalPauseValue.md#property-timeoutdecision) instead of waiting for a human - the auto-deny composition for deferred permission decisions. Absent ⇒ the approval waits indefinitely (pre-E1 behaviour). | [packages/core/src/channels/durable.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L68) |
