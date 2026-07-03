[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createDeepRecallTool

# Function: createDeepRecallTool()

```ts
function createDeepRecallTool(deps): Tool<{
  asOf?: string;
  maxIterations?: number;
  query: string;
  topK?: number;
}, {
  abstained: boolean;
  hits: {
     factId: string;
     provenance?: string;
     score: number;
     sensitivity: "public" | "internal" | "secret";
     text: string;
  }[];
  iterations: number;
  sufficient: boolean;
}>;
```

Defined in: packages/memory/src/tools/recall-tools.ts:176

`deep_recall` — gated, multi-pass ("deep") recall over the user's
factual memory for HARD questions (P2-4). A local difficulty gate keeps
simple lookups single-shot; only queries judged hard trigger a
grade-and-reformulate loop (bounded by `maxIterations`, hard-capped at
5), widening to one-hop graph expansion on reformulation passes. The
output reports `abstained: true` when memory was insufficient even
after reformulating — the agent should then say it lacks the
information rather than guess. Registered only when the facade is
created with `iterativeRetrieval`; otherwise it degrades to a single
pass, so prefer the cheaper `fact_search` for ordinary lookups.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\<\{
  `asOf?`: `string`;
  `maxIterations?`: `number`;
  `query`: `string`;
  `topK?`: `number`;
\}, \{
  `abstained`: `boolean`;
  `hits`: \{
     `factId`: `string`;
     `provenance?`: `string`;
     `score`: `number`;
     `sensitivity`: `"public"` \| `"internal"` \| `"secret"`;
     `text`: `string`;
  \}[];
  `iterations`: `number`;
  `sufficient`: `boolean`;
\}\>

## Stable
