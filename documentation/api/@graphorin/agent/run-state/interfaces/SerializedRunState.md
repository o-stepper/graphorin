[**Graphorin API reference v0.5.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [run-state](/api/@graphorin/agent/run-state/index.md) / SerializedRunState

# Interface: SerializedRunState

Defined in: packages/agent/src/run-state/index.ts:49

On-disk payload returned by [serializeRunState](/api/@graphorin/agent/run-state/functions/serializeRunState.md) and accepted
by [deserializeRunState](/api/@graphorin/agent/run-state/functions/deserializeRunState.md). The shape is JSON-stable.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:52 |
| <a id="property-currentagentid"></a> `currentAgentId` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:53 |
| <a id="property-error"></a> `error?` | `readonly` | \{ `code`: `string`; `details?`: `unknown`; `message`: `string`; \} | - | packages/agent/src/run-state/index.ts:71 |
| `error.code` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:71 |
| `error.details?` | `readonly` | `unknown` | - | packages/agent/src/run-state/index.ts:71 |
| `error.message` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:71 |
| <a id="property-finishedat"></a> `finishedAt?` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:70 |
| <a id="property-handoffs"></a> `handoffs` | `readonly` | readonly [`HandoffRecord`](/api/@graphorin/core/interfaces/HandoffRecord.md)[] | - | packages/agent/src/run-state/index.ts:60 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:51 |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | - | packages/agent/src/run-state/index.ts:58 |
| <a id="property-pendingapprovals"></a> `pendingApprovals` | `readonly` | readonly [`ToolApproval`](/api/@graphorin/core/interfaces/ToolApproval.md)[] | - | packages/agent/src/run-state/index.ts:59 |
| <a id="property-promotedtools"></a> `promotedTools?` | `readonly` | readonly `string`[] | AG-19: deferred tools promoted by `tool_search` this run. | packages/agent/src/run-state/index.ts:66 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:54 |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:69 |
| <a id="property-status"></a> `status` | `readonly` | [`RunStatus`](/api/@graphorin/core/type-aliases/RunStatus.md) | - | packages/agent/src/run-state/index.ts:56 |
| <a id="property-steps"></a> `steps` | `readonly` | readonly [`RunStep`](/api/@graphorin/core/interfaces/RunStep.md)[] | - | packages/agent/src/run-state/index.ts:57 |
| <a id="property-taintsummary"></a> `taintSummary?` | `readonly` | [`RunTaintSummary`](/api/@graphorin/core/interfaces/RunTaintSummary.md) | AG-19: coarse data-flow taint summary (no untrusted text). | packages/agent/src/run-state/index.ts:64 |
| <a id="property-todos"></a> `todos?` | `readonly` | readonly [`TodoItem`](/api/@graphorin/core/interfaces/TodoItem.md)[] | D6: journaled structured plan/todo list. | packages/agent/src/run-state/index.ts:68 |
| <a id="property-usage"></a> `usage` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | - | packages/agent/src/run-state/index.ts:61 |
| <a id="property-usagebymodel"></a> `usageByModel?` | `readonly` | [`RunStateUsageByModel`](/api/@graphorin/core/interfaces/RunStateUsageByModel.md) | - | packages/agent/src/run-state/index.ts:62 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | packages/agent/src/run-state/index.ts:55 |
| <a id="property-version"></a> `version` | `readonly` | `"graphorin-run-state/1.1"` | - | packages/agent/src/run-state/index.ts:50 |
