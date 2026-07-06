[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createFactSupersedeTool

# Function: createFactSupersedeTool()

```ts
function createFactSupersedeTool(deps): Tool<FactSupersedeInput, FactSupersedeOutput>;
```

Defined in: packages/memory/src/tools/fact-tools.ts:330

`fact_supersede` - soft-supersede an old fact by storing a new one
that replaces it. The old fact is kept for replay but no longer
surfaced by default reads (they evaluate validity at NOW); it stays
reachable via `asOf` / inspector paths.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<`FactSupersedeInput`, `FactSupersedeOutput`\>

## Stable
