[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createFactForgetTool

# Function: createFactForgetTool()

```ts
function createFactForgetTool(deps): Tool<FactForgetInput, FactForgetOutput>;
```

Defined in: packages/memory/src/tools/fact-tools.ts:363

**`Stable`**

`fact_forget` - soft-delete a fact (kept for replay; never hard-
deleted at this layer).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;[`FactForgetInput`](/api/@graphorin/memory/tools/interfaces/FactForgetInput.md), [`FactForgetOutput`](/api/@graphorin/memory/tools/interfaces/FactForgetOutput.md)\&gt;
