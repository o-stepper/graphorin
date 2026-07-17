[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CONSOLIDATOR\_TIER\_DEFAULTS

# Variable: CONSOLIDATOR\_TIER\_DEFAULTS

```ts
const CONSOLIDATOR_TIER_DEFAULTS: Readonly<Record<ConsolidatorTier, {
  ceilings: ConsolidatorCeilings;
  cheapModel: string | null;
  contextualRetrieval: ContextualRetrievalMode;
  deepModel: string | null;
  formEpisodes: boolean;
  importanceScoring: boolean;
  importanceThreshold: number;
  learnedContext: boolean;
  learnedContextMaxChars: number;
  maxTranscriptChars: number;
  onExceed: OnBudgetExceed;
  phases: ReadonlyArray<ConsolidatorPhase>;
  reflection: boolean;
  reflectionMaxQuarantinedInsights: number;
  reflectionMaxQuestions: number;
}>>;
```

Defined in: [packages/memory/src/consolidator/types.ts:568](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L568)

Tier preset table. The defaults follow ADR-038 §4 - `'free'`
disables every LLM phase and pins zero ceilings, the upper tiers
widen the budget envelope progressively.

## Stable
