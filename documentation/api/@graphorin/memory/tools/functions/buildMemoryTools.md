[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [tools](/api/@graphorin/memory/tools/index.md) / buildMemoryTools

# Function: buildMemoryTools()

```ts
function buildMemoryTools(deps, options?): readonly Tool<unknown, unknown, unknown>[];
```

Defined in: packages/memory/src/tools/index.ts:85

Build the canonical eleven-memory-tool array. Order is stable -
consumers can rely on the indices for snapshot tests. `fact_history`
(P0-2) and `fact_validate` (P1-4) are appended last so the original
nine indices are unchanged. With `{ includeDeepRecall: true }` the
gated `deep_recall` tool (P2-4) is appended as a twelfth, after the
stable eleven.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |
| `options` | [`BuildMemoryToolsOptions`](/api/@graphorin/memory/tools/interfaces/BuildMemoryToolsOptions.md) |

## Returns

readonly [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`unknown`, `unknown`, `unknown`\&gt;[]

## Stable
