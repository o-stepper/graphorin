[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createFactValidateTool

# Function: createFactValidateTool()

```ts
function createFactValidateTool(deps): Tool<{
  factId: string;
  reason?: string;
}, {
  factId: string;
  validated: boolean;
}>;
```

Defined in: packages/memory/src/tools/fact-tools.ts:299

`fact_validate` — promote a quarantined fact to active (P1-4). The
validation path that admits a synthesized (consolidator / reflection)
or injection-flagged memory into action-driving recall once it has
been reviewed; the promotion is audited in `memory_history`. This is
intended as an operator / inspector action: the agent's `fact_search`
cannot enumerate quarantined facts, so it cannot be socially
engineered by a poisoned (and therefore hidden) memory into validating
one.

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
  `validated`: `boolean`;
\}\>

## Stable
