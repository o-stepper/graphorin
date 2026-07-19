[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PreCompactionHookContext

# Interface: PreCompactionHookContext

Defined in: packages/memory/src/context-engine/compaction/types.ts:229

**`Stable`**

Per-call context handed to a PRE-compaction hook -
fired BEFORE the summarizer runs, while the full buffer is still
available. This is the seam the built-in `memoryFlushHook` uses to
salvage durable facts from content that is about to be summarized
away.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | packages/memory/src/context-engine/compaction/types.ts:233 |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | The full pre-compaction buffer (what the summarizer is about to operate on) - the model-visible messages, i.e. post-guardrail content, never the raw blocked turns. | packages/memory/src/context-engine/compaction/types.ts:240 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | - | packages/memory/src/context-engine/compaction/types.ts:231 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/memory/src/context-engine/compaction/types.ts:230 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | packages/memory/src/context-engine/compaction/types.ts:232 |
| <a id="property-source"></a> `source` | `readonly` | [`CompactionSource`](/api/@graphorin/memory/type-aliases/CompactionSource.md) | - | packages/memory/src/context-engine/compaction/types.ts:234 |
