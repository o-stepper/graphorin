[**Graphorin API reference v0.13.2**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [run-state](/api/@graphorin/agent/run-state/index.md) / SerializedRunState

# Interface: SerializedRunState

Defined in: packages/agent/src/run-state/index.ts:60

**`Stable`**

On-disk payload returned by [serializeRunState](/api/@graphorin/agent/run-state/functions/serializeRunState.md) and accepted
by [deserializeRunState](/api/@graphorin/agent/run-state/functions/deserializeRunState.md). The shape is JSON-stable: binary
message/tool-outcome payloads appear in their `WireMessage` /
`WireRunStep` (base64 / href envelope) form.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:63 |
| <a id="property-currentagentid"></a> `currentAgentId` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:64 |
| <a id="property-error"></a> `error?` | `readonly` | \{ `code`: `string`; `details?`: `unknown`; `message`: `string`; \} | - | packages/agent/src/run-state/index.ts:90 |
| `error.code` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:90 |
| `error.details?` | `readonly` | `unknown` | - | packages/agent/src/run-state/index.ts:90 |
| `error.message` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:90 |
| <a id="property-finishedat"></a> `finishedAt?` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:89 |
| <a id="property-handoffs"></a> `handoffs` | `readonly` | readonly [`HandoffRecord`](/api/@graphorin/core/interfaces/HandoffRecord.md)[] | - | packages/agent/src/run-state/index.ts:71 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:62 |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`WireMessage`](/api/@graphorin/core/type-aliases/WireMessage.md)[] | - | packages/agent/src/run-state/index.ts:69 |
| <a id="property-pendingapprovals"></a> `pendingApprovals` | `readonly` | readonly [`ToolApproval`](/api/@graphorin/core/interfaces/ToolApproval.md)[] | - | packages/agent/src/run-state/index.ts:70 |
| <a id="property-pendingsubruns"></a> `pendingSubRuns?` | `readonly` | readonly [`SerializedPendingSubRun`](/api/@graphorin/agent/run-state/interfaces/SerializedPendingSubRun.md)[] | Parked sub-agent runs. Each child snapshot is itself a full `SerializedRunState` - version-stamped and secret-redacted recursively, to any nesting depth. | packages/agent/src/run-state/index.ts:87 |
| <a id="property-promotedtools"></a> `promotedTools?` | `readonly` | readonly `string`[] | Deferred tools promoted by `tool_search` this run. | packages/agent/src/run-state/index.ts:77 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:65 |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:88 |
| <a id="property-status"></a> `status` | `readonly` | [`RunStatus`](/api/@graphorin/core/type-aliases/RunStatus.md) | - | packages/agent/src/run-state/index.ts:67 |
| <a id="property-steps"></a> `steps` | `readonly` | readonly [`WireRunStep`](/api/@graphorin/core/type-aliases/WireRunStep.md)[] | - | packages/agent/src/run-state/index.ts:68 |
| <a id="property-taintsummary"></a> `taintSummary?` | `readonly` | [`RunTaintSummary`](/api/@graphorin/core/interfaces/RunTaintSummary.md) | Coarse data-flow taint summary (no untrusted text). | packages/agent/src/run-state/index.ts:75 |
| <a id="property-todos"></a> `todos?` | `readonly` | readonly [`TodoItem`](/api/@graphorin/core/interfaces/TodoItem.md)[] | Journaled structured plan/todo list. | packages/agent/src/run-state/index.ts:81 |
| <a id="property-usage"></a> `usage` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | - | packages/agent/src/run-state/index.ts:72 |
| <a id="property-usagebymodel"></a> `usageByModel?` | `readonly` | [`RunStateUsageByModel`](/api/@graphorin/core/interfaces/RunStateUsageByModel.md) | - | packages/agent/src/run-state/index.ts:73 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:66 |
| <a id="property-verdicts"></a> `verdicts?` | `readonly` | [`RunVerdicts`](/api/@graphorin/core/type-aliases/RunVerdicts.md) | Per-turn security verdicts keyed by `'<step>:<offset>'`. | packages/agent/src/run-state/index.ts:79 |
| <a id="property-version"></a> `version` | `readonly` | `"graphorin-run-state/1.2"` | - | packages/agent/src/run-state/index.ts:61 |
