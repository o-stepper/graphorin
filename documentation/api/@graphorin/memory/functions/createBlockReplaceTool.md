[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createBlockReplaceTool

# Function: createBlockReplaceTool()

```ts
function createBlockReplaceTool(deps): Tool<{
  label: string;
  newText: string;
  oldUnique: string;
}, {
  label: string;
  length: number;
}>;
```

Defined in: packages/memory/src/tools/block-tools.ts:78

`block_replace` — replace a unique substring inside a working
memory block. Throws when the substring is missing or appears more
than once.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<\{
  `label`: `string`;
  `newText`: `string`;
  `oldUnique`: `string`;
\}, \{
  `label`: `string`;
  `length`: `number`;
\}\>

## Stable
