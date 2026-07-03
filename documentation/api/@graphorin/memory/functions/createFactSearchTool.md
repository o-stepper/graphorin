[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createFactSearchTool

# Function: createFactSearchTool()

```ts
function createFactSearchTool(deps): Tool<{
  asOf?: string;
  query: string;
  tags?: string[];
  topK?: number;
}, {
  hits: {
     factId: string;
     provenance?: "user" | "tool" | "extraction" | "reflection" | "induction" | "imported";
     score: number;
     sensitivity: "public" | "internal" | "secret";
     text: string;
  }[];
}>;
```

Defined in: packages/memory/src/tools/fact-tools.ts:167

`fact_search` — hybrid (vector + FTS5) search over the user's
semantic memory. Results merged through the configured reranker.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<\{
  `asOf?`: `string`;
  `query`: `string`;
  `tags?`: `string`[];
  `topK?`: `number`;
\}, \{
  `hits`: \{
     `factId`: `string`;
     `provenance?`: `"user"` \| `"tool"` \| `"extraction"` \| `"reflection"` \| `"induction"` \| `"imported"`;
     `score`: `number`;
     `sensitivity`: `"public"` \| `"internal"` \| `"secret"`;
     `text`: `string`;
  \}[];
\}\>

## Stable
