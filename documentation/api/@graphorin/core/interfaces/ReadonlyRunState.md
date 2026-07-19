[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ReadonlyRunState

# Interface: ReadonlyRunState

Defined in: packages/core/src/types/run.ts:189

**`Stable`**

Read-only projection of [RunState](/api/@graphorin/core/interfaces/RunState.md) handed to tools and hooks
via [RunContext.state](/api/@graphorin/core/interfaces/RunContext.md#property-state) (W-047). Structurally identical to
`RunState` - `RunState` is assignable to it - but every property is
`readonly` and every array a `ReadonlyArray`, so typed tool code
cannot corrupt run bookkeeping (splice `pendingApprovals`, flip
`status`, ...). This is a compile-time contract only: there is no
runtime freeze. A hand-written mirror (not a generic DeepReadonly):
the nested types are already readonly-typed, and keyof-parity with
`RunState` is pinned by type tests.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | packages/core/src/types/run.ts:191 |
| <a id="property-currentagentid"></a> `currentAgentId` | `readonly` | `string` | - | packages/core/src/types/run.ts:192 |
| <a id="property-error"></a> `error?` | `readonly` | [`RunError`](/api/@graphorin/core/interfaces/RunError.md) | - | packages/core/src/types/run.ts:215 |
| <a id="property-finishedat"></a> `finishedAt?` | `readonly` | `string` | - | packages/core/src/types/run.ts:214 |
| <a id="property-handoffs"></a> `handoffs` | `readonly` | readonly [`HandoffRecord`](/api/@graphorin/core/interfaces/HandoffRecord.md)[] | - | packages/core/src/types/run.ts:199 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/core/src/types/run.ts:190 |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | - | packages/core/src/types/run.ts:197 |
| <a id="property-pendingapprovals"></a> `pendingApprovals` | `readonly` | readonly [`ToolApproval`](/api/@graphorin/core/interfaces/ToolApproval.md)[] | - | packages/core/src/types/run.ts:198 |
| <a id="property-pendingsubruns"></a> `pendingSubRuns?` | `readonly` | readonly `PendingSubRun`[] | See [RunState.pendingSubRuns](/api/@graphorin/core/interfaces/RunState.md#property-pendingsubruns). | packages/core/src/types/run.ts:212 |
| <a id="property-promotedtools"></a> `promotedTools?` | `readonly` | readonly `string`[] | See [RunState.promotedTools](/api/@graphorin/core/interfaces/RunState.md#property-promotedtools). | packages/core/src/types/run.ts:206 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | packages/core/src/types/run.ts:193 |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `string` | - | packages/core/src/types/run.ts:213 |
| <a id="property-status"></a> `status` | `readonly` | [`RunStatus`](/api/@graphorin/core/type-aliases/RunStatus.md) | - | packages/core/src/types/run.ts:195 |
| <a id="property-steps"></a> `steps` | `readonly` | readonly [`RunStep`](/api/@graphorin/core/interfaces/RunStep.md)[] | - | packages/core/src/types/run.ts:196 |
| <a id="property-taintsummary"></a> `taintSummary?` | `readonly` | [`RunTaintSummary`](/api/@graphorin/core/interfaces/RunTaintSummary.md) | See [RunState.taintSummary](/api/@graphorin/core/interfaces/RunState.md#property-taintsummary). | packages/core/src/types/run.ts:204 |
| <a id="property-todos"></a> `todos?` | `readonly` | readonly [`TodoItem`](/api/@graphorin/core/interfaces/TodoItem.md)[] | See [RunState.todos](/api/@graphorin/core/interfaces/RunState.md#property-todos). | packages/core/src/types/run.ts:210 |
| <a id="property-usage"></a> `usage` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | - | packages/core/src/types/run.ts:200 |
| <a id="property-usagebymodel"></a> `usageByModel?` | `readonly` | [`RunStateUsageByModel`](/api/@graphorin/core/interfaces/RunStateUsageByModel.md) | See [RunState.usageByModel](/api/@graphorin/core/interfaces/RunState.md#property-usagebymodel). | packages/core/src/types/run.ts:202 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | packages/core/src/types/run.ts:194 |
| <a id="property-verdicts"></a> `verdicts?` | `readonly` | [`RunVerdicts`](/api/@graphorin/core/type-aliases/RunVerdicts.md) | See [RunState.verdicts](/api/@graphorin/core/interfaces/RunState.md#property-verdicts). | packages/core/src/types/run.ts:208 |
