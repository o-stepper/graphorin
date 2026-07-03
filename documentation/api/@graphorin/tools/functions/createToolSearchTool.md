[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / createToolSearchTool

# Function: createToolSearchTool()

```ts
function createToolSearchTool(opts): Tool<{
  k?: number;
  query: string;
}, {
  matches: {
     description: string;
     inputSchema: Record<string, unknown>;
     name: string;
     score: number;
     source: "semantic" | "bm25" | "regex-name";
  }[];
}>;
```

Defined in: packages/tools/src/built-in/tool-search.ts:57

Build a `tool_search` tool bound to a specific registry.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`ToolSearchToolOptions`](/api/@graphorin/tools/interfaces/ToolSearchToolOptions.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<\{
  `k?`: `number`;
  `query`: `string`;
\}, \{
  `matches`: \{
     `description`: `string`;
     `inputSchema`: `Record`\&lt;`string`, `unknown`\&gt;;
     `name`: `string`;
     `score`: `number`;
     `source`: `"semantic"` \| `"bm25"` \| `"regex-name"`;
  \}[];
\}\>

## Stable
