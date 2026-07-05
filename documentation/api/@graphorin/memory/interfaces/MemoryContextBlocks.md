[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / MemoryContextBlocks

# Interface: MemoryContextBlocks

Defined in: packages/memory/src/context-engine/index.ts:118

Compile result. Layered into the system prompt by the agent
runtime. Preserved as a stable surface from Phase 10a so
existing consumers (`memory.compile(scope)`) keep working
unchanged after Phase 10d.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-autorecalled"></a> `autoRecalled?` | `readonly` | `string` | Optional auto-recalled memory hints. | packages/memory/src/context-engine/index.ts:128 |
| <a id="property-base"></a> `base?` | `readonly` | `string` | Static narrative base (English by default; locale-aware). | packages/memory/src/context-engine/index.ts:124 |
| <a id="property-cachehints"></a> `cacheHints?` | `readonly` | readonly `string`[] | Optional `cache_control` hints for prompt-cache aware providers. | packages/memory/src/context-engine/index.ts:130 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `string` | Bucketed memory metadata block. | packages/memory/src/context-engine/index.ts:126 |
| <a id="property-rules"></a> `rules?` | `readonly` | `string` | Active procedural rules block. | packages/memory/src/context-engine/index.ts:122 |
| <a id="property-workingblocks"></a> `workingBlocks?` | `readonly` | `string` | XML-rendered working memory blocks, when any. | packages/memory/src/context-engine/index.ts:120 |
