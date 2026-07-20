[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunState

# Interface: RunState

Defined in: packages/core/src/types/run.ts:93

**`Stable`**

The full, serializable state of a run. The agent runtime persists this
to the checkpoint store on every `awaiting_approval` boundary, so a
separate process can resume the run.

JSON stability is guaranteed by the serializer, not by naive
`JSON.stringify`: `messages` and tool-outcome `contentParts` may carry
`Uint8Array | URL` payloads, which the documented wire projection
(`WireRunState` via `toJsonSafeRunState`) encodes as base64 / href
envelopes before stringification. No `Map`, `Set` or `Date` appears
anywhere in the shape.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | packages/core/src/types/run.ts:95 |
| <a id="property-currentagentid"></a> `currentAgentId` | `readonly` | `string` | The agent whose model drives the NEXT step. During a handoff it is the target for exactly the child observation window and is restored to the parent when the child returns - the child's identity is durably recorded in [RunState.handoffs](/api/@graphorin/core/interfaces/RunState.md#property-handoffs), never here. | packages/core/src/types/run.ts:102 |
| <a id="property-error"></a> `error?` | `public` | [`RunError`](/api/@graphorin/core/interfaces/RunError.md) | - | packages/core/src/types/run.ts:160 |
| <a id="property-finishedat"></a> `finishedAt?` | `public` | `string` | - | packages/core/src/types/run.ts:159 |
| <a id="property-handoffs"></a> `handoffs` | `readonly` | [`HandoffRecord`](/api/@graphorin/core/interfaces/HandoffRecord.md)[] | - | packages/core/src/types/run.ts:109 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/core/src/types/run.ts:94 |
| <a id="property-messages"></a> `messages` | `readonly` | [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | - | packages/core/src/types/run.ts:107 |
| <a id="property-pendingapprovals"></a> `pendingApprovals` | `readonly` | [`ToolApproval`](/api/@graphorin/core/interfaces/ToolApproval.md)[] | - | packages/core/src/types/run.ts:108 |
| <a id="property-pendingsubruns"></a> `pendingSubRuns?` | `public` | [`PendingSubRun`](/api/@graphorin/core/interfaces/PendingSubRun.md)[] | Sub-agent runs parked on this (parent) run because the child suspended with `awaiting_approval`. Each entry snapshots the suspended child state; the child's pending approvals are mirrored onto this run's `pendingApprovals` with `subRunToolCallId` set to the entry's `toolCallId`. Absent until a child parks. | packages/core/src/types/run.ts:157 |
| <a id="property-promotedtools"></a> `promotedTools?` | `public` | readonly `string`[] | Names of deferred tools promoted by `tool_search` this run, carried across suspend/resume so discovered tools remain in the per-step catalogue. | packages/core/src/types/run.ts:131 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | packages/core/src/types/run.ts:103 |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `string` | - | packages/core/src/types/run.ts:158 |
| <a id="property-status"></a> `status` | `public` | [`RunStatus`](/api/@graphorin/core/type-aliases/RunStatus.md) | - | packages/core/src/types/run.ts:105 |
| <a id="property-steps"></a> `steps` | `readonly` | [`RunStep`](/api/@graphorin/core/interfaces/RunStep.md)[] | - | packages/core/src/types/run.ts:106 |
| <a id="property-taintsummary"></a> `taintSummary?` | `public` | [`RunTaintSummary`](/api/@graphorin/core/interfaces/RunTaintSummary.md) | Coarse data-flow taint summary, carried across suspend/resume so a resumed run does not start with an empty ledger that silently un-gates sinks exposed before the suspend. Structurally matches `@graphorin/security`'s `TaintLedgerSnapshot` (core takes no security dependency); only the load-bearing flags are persisted - never the tracked untrusted text spans. | packages/core/src/types/run.ts:126 |
| <a id="property-todos"></a> `todos?` | `public` | readonly [`TodoItem`](/api/@graphorin/core/interfaces/TodoItem.md)[] | Structured plan/todo list - the agent's own working plan, journaled so it survives suspend/resume (a TodoWrite-style tool mutates it, and attention-recitation renders it back into the prompt each turn). Absent until the agent writes one. | packages/core/src/types/run.ts:149 |
| <a id="property-usage"></a> `usage` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | - | packages/core/src/types/run.ts:110 |
| <a id="property-usagebymodel"></a> `usageByModel?` | `public` | [`RunStateUsageByModel`](/api/@graphorin/core/interfaces/RunStateUsageByModel.md) | Per-model usage breakdown. Populated by the per-step retry loop when `Agent.fallbackModels` fires. Backward-compat: rehydrating a serialized state that omits the field synthesizes a single-entry map for the primary model. | packages/core/src/types/run.ts:117 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | packages/core/src/types/run.ts:104 |
| <a id="property-verdicts"></a> `verdicts?` | `public` | [`RunVerdicts`](/api/@graphorin/core/type-aliases/RunVerdicts.md) | Per-turn security verdicts, keyed by turn position `'<stepNumber>:<offsetInStep>'` (the step's assistant turn is offset 0; step 0 is the pre-step input stage). Stamped by the run loop's commit gates so downstream consumers - the `Session.push` boundary and the memory ingest gate - can exclude guardrail-blocked turns from long-term memory. Widen-only: gates only ever ADD entries. Compaction wipes entries for the turns it summarized away. Absent until a gate fires. | packages/core/src/types/run.ts:142 |
