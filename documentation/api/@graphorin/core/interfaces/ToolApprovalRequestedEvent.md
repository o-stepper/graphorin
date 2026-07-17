[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolApprovalRequestedEvent

# Interface: ToolApprovalRequestedEvent

Defined in: [packages/core/src/types/agent-event.ts:212](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L212)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-mode"></a> `mode?` | `readonly` | `"ask"` \| `"defer"` | E1: which permission verdict parked the approval (`'ask'` | `'defer'`); absent for plain `needsApproval` gates. Mirrors `ToolApproval.mode` so a subscriber can route deferred approvals without re-reading the run state. | [packages/core/src/types/agent-event.ts:222](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L222) |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | - | [packages/core/src/types/agent-event.ts:215](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L215) |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | [packages/core/src/types/agent-event.ts:214](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L214) |
| <a id="property-type"></a> `type` | `readonly` | `"tool.approval.requested"` | - | [packages/core/src/types/agent-event.ts:213](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L213) |
