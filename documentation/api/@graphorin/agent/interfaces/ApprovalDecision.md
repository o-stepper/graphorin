[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / ApprovalDecision

# Interface: ApprovalDecision

Defined in: packages/agent/src/types.ts:522

**`Stable`**

Single approval decision attached to a [ResumeDirective](/api/@graphorin/agent/interfaces/ResumeDirective.md).
Mirrors the directive surface the HITL caller supplies on resume
(per `Command(approval: { granted, reason? })` in the agent-loop
reference, renamed to `Directive` per Graphorin's own naming).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-granted"></a> `granted` | `readonly` | `boolean` | - | packages/agent/src/types.ts:524 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | - | packages/agent/src/types.ts:525 |
| <a id="property-subruntoolcallid"></a> `subRunToolCallId?` | `readonly` | `string` | Echo of `ToolApproval.subRunToolCallId` for approvals that belong to a parked sub-agent run. Operators read the pair (`toolCallId`, `subRunToolCallId`) from `RunState.pendingApprovals` and return BOTH fields; decisions match on the composite key, so child-local toolCallId collisions across two parked children never cross-apply. A decision without this field applies only to the parent's own (unparked) approvals. | packages/agent/src/types.ts:535 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | packages/agent/src/types.ts:523 |
