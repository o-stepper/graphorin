[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createBlockAppendTool

# Function: createBlockAppendTool()

```ts
function createBlockAppendTool(deps): Tool<{
  content: string;
  label: string;
}, {
  label: string;
  length: number;
}>;
```

Defined in: packages/memory/src/tools/block-tools.ts:49

`block_append` - append text (with a newline separator) to a working
memory block.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<\{
  `content`: `string`;
  `label`: `string`;
\}, \{
  `label`: `string`;
  `length`: `number`;
\}\>

## Stable
