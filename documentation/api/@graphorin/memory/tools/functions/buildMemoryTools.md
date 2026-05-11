[**Graphorin API reference v0.1.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [tools](/api/@graphorin/memory/tools/index.md) / buildMemoryTools

# Function: buildMemoryTools()

```ts
function buildMemoryTools(deps): readonly Tool<unknown, unknown, unknown>[];
```

Defined in: packages/memory/src/tools/index.ts:48

Build the canonical nine-memory-tool array. Order is stable —
consumers can rely on the indices for snapshot tests.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

readonly [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`unknown`, `unknown`, `unknown`\&gt;[]

## Stable
