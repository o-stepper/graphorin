[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / allocateToolCatalogue

# Function: allocateToolCatalogue()

```ts
function allocateToolCatalogue(input): Promise<ToolCatalogueResult>;
```

Defined in: packages/memory/src/context-engine/tool-budget/allocator.ts:27

Run the tool-catalogue allocator. Pure function; the lazy-loaded
set is read but **not** mutated — the caller threads the new
state through their own bookkeeping (the agent runtime in Phase
12 owns the per-`RunContext` lifecycle).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`ToolCatalogueInput`](/api/@graphorin/memory/interfaces/ToolCatalogueInput.md) |

## Returns

`Promise`\&lt;[`ToolCatalogueResult`](/api/@graphorin/memory/interfaces/ToolCatalogueResult.md)\&gt;

## Stable
