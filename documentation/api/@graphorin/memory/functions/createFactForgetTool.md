[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createFactForgetTool

# Function: createFactForgetTool()

```ts
function createFactForgetTool(deps): Tool<{
  factId: string;
  reason?: string;
}, {
  factId: string;
  forgotten: boolean;
}>;
```

Defined in: packages/memory/src/tools/fact-tools.ts:181

`fact_forget` — soft-delete a fact (kept for replay; never hard-
deleted at this layer).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<\{
  `factId`: `string`;
  `reason?`: `string`;
\}, \{
  `factId`: `string`;
  `forgotten`: `boolean`;
\}\>

## Stable
