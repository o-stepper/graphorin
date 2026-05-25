[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / LazyLoadedToolEntry

# Interface: LazyLoadedToolEntry

Defined in: packages/memory/src/context-engine/tool-budget/types.ts:30

Per-`RunContext` lazy-loaded set bookkeeping. Each entry tracks
when the tool was injected (via `tool_search`) and when the
model last invoked it. The LRU eviction policy at the cap
boundary uses `lastUsedAt` ascending.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-addedat"></a> `addedAt` | `readonly` | `number` | packages/memory/src/context-engine/tool-budget/types.ts:32 |
| <a id="property-lastusedat"></a> `lastUsedAt` | `readonly` | `number` | packages/memory/src/context-engine/tool-budget/types.ts:33 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | packages/memory/src/context-engine/tool-budget/types.ts:31 |
