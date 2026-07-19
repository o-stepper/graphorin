[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createBlockReplaceTool

# Function: createBlockReplaceTool()

```ts
function createBlockReplaceTool(deps): Tool<BlockReplaceInput, BlockReplaceOutput>;
```

Defined in: packages/memory/src/tools/block-tools.ts:125

**`Stable`**

`block_replace` - replace a unique substring inside a working
memory block. Throws when the substring is missing or appears more
than once.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`BlockReplaceInput`, `BlockReplaceOutput`\&gt;
