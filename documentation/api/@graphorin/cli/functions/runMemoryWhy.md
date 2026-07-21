[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runMemoryWhy

# Function: runMemoryWhy()

```ts
function runMemoryWhy(options): Promise<MemoryWhyResult>;
```

Defined in: packages/cli/src/commands/memory.ts:741

**`Stable`**

`graphorin memory why` - explain why facts were recalled, by decoding the
`memory.search.semantic.explain` attribute off the persisted recall spans.
Pure read-only inspection; requires the SQLite span exporter to have recorded
spans. Empty when nothing was recorded.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MemoryWhyOptions`](/api/@graphorin/cli/interfaces/MemoryWhyOptions.md) |

## Returns

`Promise`\&lt;[`MemoryWhyResult`](/api/@graphorin/cli/interfaces/MemoryWhyResult.md)\&gt;
