[**Graphorin API reference v0.13.4**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [tools](/api/@graphorin/memory/tools/index.md) / buildMemoryTools

# Function: buildMemoryTools()

```ts
function buildMemoryTools(deps, options?): readonly Tool<unknown, unknown, unknown>[];
```

Defined in: packages/memory/src/tools/index.ts:155

**`Stable`**

Build the canonical memory-tool array for a profile. Order is stable
for `'full'` / `'reviser'` - consumers can rely on the indices for
snapshot tests. `fact_history` and `fact_validate` are
appended last so the original nine indices are unchanged. With
`{ includeDeepRecall: true }` the gated `deep_recall` tool is
appended after the stable eleven; `runbook_search` after it. Both
gated appendices are reads, so they appear in every profile.

`'interactive'` returns ONLY the read tools, preserving their
relative order from the canonical set.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |
| `options` | [`BuildMemoryToolsOptions`](/api/@graphorin/memory/tools/interfaces/BuildMemoryToolsOptions.md) |

## Returns

readonly [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`unknown`, `unknown`, `unknown`\&gt;[]
