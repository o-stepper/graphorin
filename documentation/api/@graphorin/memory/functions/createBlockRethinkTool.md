[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createBlockRethinkTool

# Function: createBlockRethinkTool()

```ts
function createBlockRethinkTool(deps): Tool<{
  label: string;
  newValue: string;
}, {
  label: string;
  length: number;
}>;
```

Defined in: packages/memory/src/tools/block-tools.ts:105

`block_rethink` — rewrite a working memory block from scratch.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<\{
  `label`: `string`;
  `newValue`: `string`;
\}, \{
  `label`: `string`;
  `length`: `number`;
\}\>

## Stable
