[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CONSOLIDATOR\_TIER\_DEFAULTS

# Variable: CONSOLIDATOR\_TIER\_DEFAULTS

```ts
const CONSOLIDATOR_TIER_DEFAULTS: Readonly<Record<ConsolidatorTier, {
  ceilings: ConsolidatorCeilings;
  cheapModel: string | null;
  deepModel: string | null;
  onExceed: OnBudgetExceed;
  phases: ReadonlyArray<ConsolidatorPhase>;
}>>;
```

Defined in: packages/memory/src/consolidator/types.ts:273

Tier preset table. The defaults follow ADR-038 §4 — `'free'`
disables every LLM phase and pins zero ceilings, the upper tiers
widen the budget envelope progressively.

## Stable
