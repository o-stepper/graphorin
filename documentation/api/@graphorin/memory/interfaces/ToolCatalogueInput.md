[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ToolCatalogueInput

# Interface: ToolCatalogueInput

Defined in: packages/memory/src/context-engine/tool-budget/types.ts:63

Per-call input to [allocateToolCatalogue](/api/@graphorin/memory/functions/allocateToolCatalogue.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-eagertools"></a> `eagerTools` | `readonly` | readonly [`ToolBudgetEntry`](/api/@graphorin/memory/interfaces/ToolBudgetEntry.md)[] | All eager tools registered against the agent (RB-44 § eager set). | packages/memory/src/context-engine/tool-budget/types.ts:65 |
| <a id="property-lastusermessage"></a> `lastUserMessage?` | `readonly` | `string` | Last user message (used to derive the synthetic ranking query). | packages/memory/src/context-engine/tool-budget/types.ts:76 |
| <a id="property-lazyloadedtools"></a> `lazyLoadedTools` | `readonly` | readonly [`LazyLoadedToolEntry`](/api/@graphorin/memory/interfaces/LazyLoadedToolEntry.md)[] | Per-`RunContext` lazy-loaded set carried across steps. | packages/memory/src/context-engine/tool-budget/types.ts:67 |
| <a id="property-maxtoolsincontext"></a> `maxToolsInContext` | `readonly` | `number` | Cap on the per-step catalogue cardinality. Default `30`. | packages/memory/src/context-engine/tool-budget/types.ts:74 |
| <a id="property-preparestepoverride"></a> `prepareStepOverride?` | `readonly` | readonly [`ToolBudgetEntry`](/api/@graphorin/memory/interfaces/ToolBudgetEntry.md)[] | `prepareStep({ tools })` precedence override. When set, the allocator returns the supplied tools verbatim and bypasses the cap. The lazy-loaded set is unaffected. | packages/memory/src/context-engine/tool-budget/types.ts:88 |
| <a id="property-ranker"></a> `ranker?` | `readonly` | [`ToolRanker`](/api/@graphorin/memory/interfaces/ToolRanker.md) | Pluggable ranker. When omitted, the allocator preserves registration order (deterministic) and emits the deferral decision per the cap. | packages/memory/src/context-engine/tool-budget/types.ts:82 |
| <a id="property-toolsearch"></a> `toolSearch?` | `readonly` | [`ToolBudgetEntry`](/api/@graphorin/memory/interfaces/ToolBudgetEntry.md) | Always-present `tool_search` tool. Optional — when omitted the allocator skips the auto-injection path entirely. | packages/memory/src/context-engine/tool-budget/types.ts:72 |
