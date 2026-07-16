[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemoryMetadata

# Interface: MemoryMetadata

Defined in: [packages/core/src/types/memory.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L78)

Snapshot of memory-tier counters surfaced to the model via the
memory-aware system prompt. Implementations live in `@graphorin/memory`;
the type sits here so the agent runtime can include it in its
`RunContext` without a memory dependency.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-activerulecount"></a> `activeRuleCount` | `readonly` | `number` | Active rules count (after context filtering). | [packages/core/src/types/memory.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L86) |
| <a id="property-episodecount"></a> `episodeCount` | `readonly` | `number` | Number of episodes stored for the user. | [packages/core/src/types/memory.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L82) |
| <a id="property-factcount"></a> `factCount` | `readonly` | `number` | Total number of facts in the user's semantic memory. | [packages/core/src/types/memory.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L80) |
| <a id="property-lastconsolidatedat"></a> `lastConsolidatedAt?` | `readonly` | `string` | Last consolidator run, ISO-8601, if any. | [packages/core/src/types/memory.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L90) |
| <a id="property-messagecount"></a> `messageCount` | `readonly` | `number` | Number of past messages indexed for retrieval. | [packages/core/src/types/memory.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L84) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | Optional, free-form metadata tags surfaced to the model. | [packages/core/src/types/memory.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L92) |
| <a id="property-workingblockcount"></a> `workingBlockCount` | `readonly` | `number` | Number of declared working blocks. | [packages/core/src/types/memory.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L88) |
