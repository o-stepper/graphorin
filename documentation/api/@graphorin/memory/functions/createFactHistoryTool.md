[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createFactHistoryTool

# Function: createFactHistoryTool()

```ts
function createFactHistoryTool(deps): Tool<{
  factId: string;
}, {
  chain: {
     factId: string;
     sensitivity: "public" | "internal" | "secret";
     supersededBy?: string;
     supersedes?: string;
     text: string;
     validFrom?: string;
     validTo?: string;
  }[];
}>;
```

Defined in: packages/memory/src/tools/fact-tools.ts:294

`fact_history` - trace how a fact changed over time. Returns the
full bi-temporal supersede chain the given fact belongs to, oldest →
newest, including superseded entries, so the agent can answer "what
did the user say before" / "how did this change". Read-only. P0-2.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<\{
  `factId`: `string`;
\}, \{
  `chain`: \{
     `factId`: `string`;
     `sensitivity`: `"public"` \| `"internal"` \| `"secret"`;
     `supersededBy?`: `string`;
     `supersedes?`: `string`;
     `text`: `string`;
     `validFrom?`: `string`;
     `validTo?`: `string`;
  \}[];
\}\>

## Stable
