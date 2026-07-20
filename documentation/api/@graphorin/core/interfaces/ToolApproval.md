[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolApproval

# Interface: ToolApproval

Defined in: packages/core/src/types/tool.ts:297

**`Stable`**

Pending approval bookkeeping: a tool that needed human confirmation
before execution. Stored on `RunState.pendingApprovals` until the
caller resumes the run with a granted/denied decision.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `unknown` | - | packages/core/src/types/tool.ts:300 |
| <a id="property-mode"></a> `mode?` | `readonly` | `"ask"` \| `"defer"` | Which permission verdict parked this approval. `'ask'` wants an interactive human decision now; `'defer'` is parked for asynchronous resolution (e.g. a workflow awakeable with a durable-timer auto-deny) - the harness routes the two differently. Absent on approvals raised by a plain `needsApproval` gate (semantically `'ask'`). | packages/core/src/types/tool.ts:311 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | - | packages/core/src/types/tool.ts:301 |
| <a id="property-requestedat"></a> `requestedAt` | `readonly` | `string` | - | packages/core/src/types/tool.ts:302 |
| <a id="property-subruntoolcallid"></a> `subRunToolCallId?` | `readonly` | `string` | Set when this approval belongs to a PARKED sub-agent run. It is the PARENT's toolCallId of the parked handoff / sub-agent call (the `RunState.pendingSubRuns` key), never a child-local id. Operators echo it back on the matching `ApprovalDecision` so resume decisions match on the composite (toolCallId, subRunToolCallId) key - child-local toolCallIds of two different children may collide. | packages/core/src/types/tool.ts:321 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | packages/core/src/types/tool.ts:298 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | packages/core/src/types/tool.ts:299 |
