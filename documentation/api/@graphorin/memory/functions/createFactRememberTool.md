[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createFactRememberTool

# Function: createFactRememberTool()

```ts
function createFactRememberTool(deps): Tool<FactRememberInput, FactRememberOutput>;
```

Defined in: packages/memory/src/tools/fact-tools.ts:232

**`Stable`**

`fact_remember` - persist a single semantic fact. The minimum-viable
pipeline writes the fact straight through with MD5 deduplication;
Phase 10b extends the body with the multi-stage conflict resolution.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`FactRememberInput`, `FactRememberOutput`\&gt;
