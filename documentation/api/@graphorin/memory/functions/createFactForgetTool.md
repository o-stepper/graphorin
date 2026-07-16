[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createFactForgetTool

# Function: createFactForgetTool()

```ts
function createFactForgetTool(deps): Tool<FactForgetInput, FactForgetOutput>;
```

Defined in: [packages/memory/src/tools/fact-tools.ts:363](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tools/fact-tools.ts#L363)

`fact_forget` - soft-delete a fact (kept for replay; never hard-
deleted at this layer).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`FactForgetInput`, `FactForgetOutput`\&gt;

## Stable
