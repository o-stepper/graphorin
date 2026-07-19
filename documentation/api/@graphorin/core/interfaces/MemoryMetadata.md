[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemoryMetadata

# Interface: MemoryMetadata

Defined in: packages/core/src/types/memory.ts:78

**`Stable`**

Snapshot of memory-tier counters surfaced to the model via the
memory-aware system prompt. Implementations live in `@graphorin/memory`;
the type sits here so the agent runtime can include it in its
`RunContext` without a memory dependency.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-activerulecount"></a> `activeRuleCount` | `readonly` | `number` | Active rules count (after context filtering). | packages/core/src/types/memory.ts:86 |
| <a id="property-episodecount"></a> `episodeCount` | `readonly` | `number` | Number of episodes stored for the user. | packages/core/src/types/memory.ts:82 |
| <a id="property-factcount"></a> `factCount` | `readonly` | `number` | Total number of facts in the user's semantic memory. | packages/core/src/types/memory.ts:80 |
| <a id="property-lastconsolidatedat"></a> `lastConsolidatedAt?` | `readonly` | `string` | Last consolidator run, ISO-8601, if any. | packages/core/src/types/memory.ts:90 |
| <a id="property-messagecount"></a> `messageCount` | `readonly` | `number` | Number of past messages indexed for retrieval. | packages/core/src/types/memory.ts:84 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | Optional, free-form metadata tags surfaced to the model. | packages/core/src/types/memory.ts:92 |
| <a id="property-workingblockcount"></a> `workingBlockCount` | `readonly` | `number` | Number of declared working blocks. | packages/core/src/types/memory.ts:88 |
