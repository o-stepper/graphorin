[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / PendingSubRun

# Interface: PendingSubRun

Defined in: packages/core/src/types/run.ts:172

**`Stable`**

One sub-agent run parked on its parent because the child suspended
awaiting approvals. `state` is a JSON-compatible snapshot of
the suspended child run; in serialized form (the agent package's
`SerializedRunState`) it carries the child's own version-stamped,
secret-redacted snapshot, recursively.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-state"></a> `state` | `readonly` | [`RunState`](/api/@graphorin/core/interfaces/RunState.md) | Suspended child run state (carries the child's own pendingApprovals). | packages/core/src/types/run.ts:180 |
| <a id="property-targetagentname"></a> `targetAgentName` | `readonly` | `string` | The child agent's configured name (for diagnostics and usage folding). | packages/core/src/types/run.ts:178 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | The PARENT's toolCallId of the parked handoff / sub-agent call. | packages/core/src/types/run.ts:174 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | The parent-side tool name (`transfer_to_<name>` or the toTool name). | packages/core/src/types/run.ts:176 |
