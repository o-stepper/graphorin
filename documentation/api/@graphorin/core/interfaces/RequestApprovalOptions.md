[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RequestApprovalOptions

# Interface: RequestApprovalOptions

Defined in: [packages/core/src/channels/durable.ts:246](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L246)

Options for [requestApproval](/api/@graphorin/core/functions/requestApproval.md) (E1 defer-timeout).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-timeoutat"></a> `timeoutAt?` | `readonly` | `string` \| `number` \| `Date` | Absolute deadline. When it passes with the approval still pending, `workflow.tick(threadId)` resolves it with `timeoutDecision` (the auto-deny composition); the workflow timer daemon enumerates the deadline exactly like a `sleepUntil` timer. How long to wait is caller policy - the framework only provides the mechanism. | [packages/core/src/channels/durable.ts:254](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L254) |
| <a id="property-timeoutdecision"></a> `timeoutDecision?` | `readonly` | `unknown` | JSON-safe decision delivered on timeout. Default [DEFAULT\_APPROVAL\_TIMEOUT\_DECISION](/api/@graphorin/core/variables/DEFAULT_APPROVAL_TIMEOUT_DECISION.md) (a deny) - an unattended deferred permission fails closed. | [packages/core/src/channels/durable.ts:260](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L260) |
