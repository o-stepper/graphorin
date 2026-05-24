[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunState

# Interface: RunState

Defined in: packages/core/src/types/run.ts:59

The full, serializable state of a run. The agent runtime persists this
to the checkpoint store on every `awaiting_approval` boundary, so a
separate process can resume the run.

The shape is intentionally JSON-stable: every nested type is plain
`JSON`-encodable (no `Map`, no `Set`, no `Date`).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | packages/core/src/types/run.ts:61 |
| <a id="property-currentagentid"></a> `currentAgentId` | `readonly` | `string` | - | packages/core/src/types/run.ts:62 |
| <a id="property-error"></a> `error?` | `public` | [`RunError`](/api/@graphorin/core/interfaces/RunError.md) | - | packages/core/src/types/run.ts:81 |
| <a id="property-finishedat"></a> `finishedAt?` | `public` | `string` | - | packages/core/src/types/run.ts:80 |
| <a id="property-handoffs"></a> `handoffs` | `readonly` | [`HandoffRecord`](/api/@graphorin/core/interfaces/HandoffRecord.md)[] | - | packages/core/src/types/run.ts:69 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/core/src/types/run.ts:60 |
| <a id="property-messages"></a> `messages` | `readonly` | [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | - | packages/core/src/types/run.ts:67 |
| <a id="property-pendingapprovals"></a> `pendingApprovals` | `readonly` | [`ToolApproval`](/api/@graphorin/core/interfaces/ToolApproval.md)[] | - | packages/core/src/types/run.ts:68 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | packages/core/src/types/run.ts:63 |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `string` | - | packages/core/src/types/run.ts:79 |
| <a id="property-status"></a> `status` | `public` | [`RunStatus`](/api/@graphorin/core/type-aliases/RunStatus.md) | - | packages/core/src/types/run.ts:65 |
| <a id="property-steps"></a> `steps` | `readonly` | [`RunStep`](/api/@graphorin/core/interfaces/RunStep.md)[] | - | packages/core/src/types/run.ts:66 |
| <a id="property-usage"></a> `usage` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | - | packages/core/src/types/run.ts:70 |
| <a id="property-usagebymodel"></a> `usageByModel?` | `public` | [`RunStateUsageByModel`](/api/@graphorin/core/interfaces/RunStateUsageByModel.md) | Per-model usage breakdown. Populated by the per-step retry loop when `Agent.fallbackModels` fires (RB-48 / suggested DEC-164 / suggested ADR-052). Backward-compat: rehydrating a serialized state that omits the field synthesizes a single-entry map for the primary model. | packages/core/src/types/run.ts:78 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | packages/core/src/types/run.ts:64 |
