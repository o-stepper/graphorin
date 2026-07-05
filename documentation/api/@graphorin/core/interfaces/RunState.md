[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunState

# Interface: RunState

Defined in: packages/core/src/types/run.ts:81

The full, serializable state of a run. The agent runtime persists this
to the checkpoint store on every `awaiting_approval` boundary, so a
separate process can resume the run.

The shape is intentionally JSON-stable: every nested type is plain
`JSON`-encodable (no `Map`, no `Set`, no `Date`).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | packages/core/src/types/run.ts:83 |
| <a id="property-currentagentid"></a> `currentAgentId` | `readonly` | `string` | - | packages/core/src/types/run.ts:84 |
| <a id="property-error"></a> `error?` | `public` | [`RunError`](/api/@graphorin/core/interfaces/RunError.md) | - | packages/core/src/types/run.ts:124 |
| <a id="property-finishedat"></a> `finishedAt?` | `public` | `string` | - | packages/core/src/types/run.ts:123 |
| <a id="property-handoffs"></a> `handoffs` | `readonly` | [`HandoffRecord`](/api/@graphorin/core/interfaces/HandoffRecord.md)[] | - | packages/core/src/types/run.ts:91 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/core/src/types/run.ts:82 |
| <a id="property-messages"></a> `messages` | `readonly` | [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | - | packages/core/src/types/run.ts:89 |
| <a id="property-pendingapprovals"></a> `pendingApprovals` | `readonly` | [`ToolApproval`](/api/@graphorin/core/interfaces/ToolApproval.md)[] | - | packages/core/src/types/run.ts:90 |
| <a id="property-promotedtools"></a> `promotedTools?` | `public` | readonly `string`[] | AG-19: names of deferred tools promoted by `tool_search` this run, carried across suspend/resume so discovered tools remain in the per-step catalogue. | packages/core/src/types/run.ts:114 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | packages/core/src/types/run.ts:85 |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `string` | - | packages/core/src/types/run.ts:122 |
| <a id="property-status"></a> `status` | `public` | [`RunStatus`](/api/@graphorin/core/type-aliases/RunStatus.md) | - | packages/core/src/types/run.ts:87 |
| <a id="property-steps"></a> `steps` | `readonly` | [`RunStep`](/api/@graphorin/core/interfaces/RunStep.md)[] | - | packages/core/src/types/run.ts:88 |
| <a id="property-taintsummary"></a> `taintSummary?` | `public` | [`RunTaintSummary`](/api/@graphorin/core/interfaces/RunTaintSummary.md) | AG-19: coarse data-flow taint summary, carried across suspend/resume so a resumed run does not start with an empty ledger that silently un-gates sinks exposed before the suspend. Structurally matches `@graphorin/security`'s `TaintLedgerSnapshot` (core takes no security dependency); only the load-bearing flags are persisted - never the tracked untrusted text spans. | packages/core/src/types/run.ts:109 |
| <a id="property-todos"></a> `todos?` | `public` | readonly [`TodoItem`](/api/@graphorin/core/interfaces/TodoItem.md)[] | D6 structured plan/todo list - the agent's own working plan, journaled so it survives suspend/resume (a TodoWrite-style tool mutates it, and attention-recitation renders it back into the prompt each turn). Absent until the agent writes one. | packages/core/src/types/run.ts:121 |
| <a id="property-usage"></a> `usage` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | - | packages/core/src/types/run.ts:92 |
| <a id="property-usagebymodel"></a> `usageByModel?` | `public` | [`RunStateUsageByModel`](/api/@graphorin/core/interfaces/RunStateUsageByModel.md) | Per-model usage breakdown. Populated by the per-step retry loop when `Agent.fallbackModels` fires (RB-48 / suggested DEC-164 / suggested ADR-052). Backward-compat: rehydrating a serialized state that omits the field synthesizes a single-entry map for the primary model. | packages/core/src/types/run.ts:100 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | packages/core/src/types/run.ts:86 |
