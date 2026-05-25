[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PostCompactionHookContext

# Interface: PostCompactionHookContext

Defined in: packages/memory/src/context-engine/compaction/types.ts:98

Per-call context handed to a post-compaction hook.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/memory/src/context-engine/compaction/types.ts:103 |
| <a id="property-result"></a> `result` | `readonly` | [`CompactionResult`](/api/@graphorin/memory/interfaces/CompactionResult.md) | packages/memory/src/context-engine/compaction/types.ts:99 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/memory/src/context-engine/compaction/types.ts:101 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | packages/memory/src/context-engine/compaction/types.ts:100 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/memory/src/context-engine/compaction/types.ts:102 |
| <a id="property-source"></a> `source` | `readonly` | [`CompactionSource`](/api/@graphorin/memory/type-aliases/CompactionSource.md) | packages/memory/src/context-engine/compaction/types.ts:104 |
