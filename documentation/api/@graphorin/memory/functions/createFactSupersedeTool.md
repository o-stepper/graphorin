[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createFactSupersedeTool

# Function: createFactSupersedeTool()

```ts
function createFactSupersedeTool(deps): Tool<{
  newText: string;
  oldId: string;
  reason?: string;
}, {
  newId: string;
  oldId: string;
}>;
```

Defined in: packages/memory/src/tools/fact-tools.ts:148

`fact_supersede` — soft-supersede an old fact by storing a new one
that replaces it. The old fact is kept for replay but ranked below
the new one.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<\{
  `newText`: `string`;
  `oldId`: `string`;
  `reason?`: `string`;
\}, \{
  `newId`: `string`;
  `oldId`: `string`;
\}\>

## Stable
