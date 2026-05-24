[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ToolCatalogueResult

# Interface: ToolCatalogueResult

Defined in: packages/memory/src/context-engine/tool-budget/types.ts:96

Per-call result of [allocateToolCatalogue](/api/@graphorin/memory/functions/allocateToolCatalogue.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-autodeferralfired"></a> `autoDeferralFired` | `readonly` | `boolean` | Whether the auto-deferral path actually fired this step. | packages/memory/src/context-engine/tool-budget/types.ts:109 |
| <a id="property-deferred"></a> `deferred` | `readonly` | readonly [`ToolBudgetEntry`](/api/@graphorin/memory/interfaces/ToolBudgetEntry.md)[] | Tools deferred from the per-step catalogue. | packages/memory/src/context-engine/tool-budget/types.ts:100 |
| <a id="property-evictedlazy"></a> `evictedLazy` | `readonly` | readonly \{ `reason`: `"lru"` \| `"cap-overflow"`; `toolName`: `string`; \}[] | Tools evicted from the lazy-loaded set this step (LRU). | packages/memory/src/context-engine/tool-budget/types.ts:102 |
| <a id="property-preparestepoverrideapplied"></a> `prepareStepOverrideApplied` | `readonly` | `boolean` | Whether `prepareStep({ tools })` precedence bypassed the allocator. | packages/memory/src/context-engine/tool-budget/types.ts:107 |
| <a id="property-visible"></a> `visible` | `readonly` | readonly [`ToolBudgetEntry`](/api/@graphorin/memory/interfaces/ToolBudgetEntry.md)[] | Visible (eager + lazy + tool_search) tools shipped to the model. | packages/memory/src/context-engine/tool-budget/types.ts:98 |
