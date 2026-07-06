[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunState

# Interface: RunState

Defined in: [packages/core/src/types/run.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L85)

The full, serializable state of a run. The agent runtime persists this
to the checkpoint store on every `awaiting_approval` boundary, so a
separate process can resume the run.

JSON stability is guaranteed by the serializer, not by naive
`JSON.stringify`: `messages` and tool-outcome `contentParts` may carry
`Uint8Array | URL` payloads, which the documented wire projection
(`WireRunState` via `toJsonSafeRunState`) encodes as base64 / href
envelopes before stringification. No `Map`, `Set` or `Date` appears
anywhere in the shape.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | [packages/core/src/types/run.ts:87](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L87) |
| <a id="property-currentagentid"></a> `currentAgentId` | `readonly` | `string` | The agent whose model drives the NEXT step. During a handoff it is the target for exactly the child observation window and is restored to the parent when the child returns (W-034) - the child's identity is durably recorded in [RunState.handoffs](/api/@graphorin/core/interfaces/RunState.md#property-handoffs), never here. | [packages/core/src/types/run.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L94) |
| <a id="property-error"></a> `error?` | `public` | [`RunError`](/api/@graphorin/core/interfaces/RunError.md) | - | [packages/core/src/types/run.ts:142](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L142) |
| <a id="property-finishedat"></a> `finishedAt?` | `public` | `string` | - | [packages/core/src/types/run.ts:141](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L141) |
| <a id="property-handoffs"></a> `handoffs` | `readonly` | [`HandoffRecord`](/api/@graphorin/core/interfaces/HandoffRecord.md)[] | - | [packages/core/src/types/run.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L101) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/core/src/types/run.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L86) |
| <a id="property-messages"></a> `messages` | `readonly` | [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | - | [packages/core/src/types/run.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L99) |
| <a id="property-pendingapprovals"></a> `pendingApprovals` | `readonly` | [`ToolApproval`](/api/@graphorin/core/interfaces/ToolApproval.md)[] | - | [packages/core/src/types/run.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L100) |
| <a id="property-pendingsubruns"></a> `pendingSubRuns?` | `public` | `PendingSubRun`[] | W-001: sub-agent runs parked on this (parent) run because the child suspended with `awaiting_approval`. Each entry snapshots the suspended child state; the child's pending approvals are mirrored onto this run's `pendingApprovals` with `subRunToolCallId` set to the entry's `toolCallId`. Absent until a child parks. | [packages/core/src/types/run.ts:139](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L139) |
| <a id="property-promotedtools"></a> `promotedTools?` | `public` | readonly `string`[] | AG-19: names of deferred tools promoted by `tool_search` this run, carried across suspend/resume so discovered tools remain in the per-step catalogue. | [packages/core/src/types/run.ts:124](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L124) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | [packages/core/src/types/run.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L95) |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `string` | - | [packages/core/src/types/run.ts:140](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L140) |
| <a id="property-status"></a> `status` | `public` | [`RunStatus`](/api/@graphorin/core/type-aliases/RunStatus.md) | - | [packages/core/src/types/run.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L97) |
| <a id="property-steps"></a> `steps` | `readonly` | [`RunStep`](/api/@graphorin/core/interfaces/RunStep.md)[] | - | [packages/core/src/types/run.ts:98](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L98) |
| <a id="property-taintsummary"></a> `taintSummary?` | `public` | [`RunTaintSummary`](/api/@graphorin/core/interfaces/RunTaintSummary.md) | AG-19: coarse data-flow taint summary, carried across suspend/resume so a resumed run does not start with an empty ledger that silently un-gates sinks exposed before the suspend. Structurally matches `@graphorin/security`'s `TaintLedgerSnapshot` (core takes no security dependency); only the load-bearing flags are persisted - never the tracked untrusted text spans. | [packages/core/src/types/run.ts:119](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L119) |
| <a id="property-todos"></a> `todos?` | `public` | readonly [`TodoItem`](/api/@graphorin/core/interfaces/TodoItem.md)[] | D6 structured plan/todo list - the agent's own working plan, journaled so it survives suspend/resume (a TodoWrite-style tool mutates it, and attention-recitation renders it back into the prompt each turn). Absent until the agent writes one. | [packages/core/src/types/run.ts:131](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L131) |
| <a id="property-usage"></a> `usage` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | - | [packages/core/src/types/run.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L102) |
| <a id="property-usagebymodel"></a> `usageByModel?` | `public` | [`RunStateUsageByModel`](/api/@graphorin/core/interfaces/RunStateUsageByModel.md) | Per-model usage breakdown. Populated by the per-step retry loop when `Agent.fallbackModels` fires (RB-48 / suggested DEC-164 / suggested ADR-052). Backward-compat: rehydrating a serialized state that omits the field synthesizes a single-entry map for the primary model. | [packages/core/src/types/run.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L110) |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | [packages/core/src/types/run.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L96) |
