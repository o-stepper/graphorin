[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorConfig

# Interface: ConsolidatorConfig

Defined in: packages/memory/src/consolidator/types.ts:105

Locked-down configuration accepted by `createConsolidator(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-autopromoteextraction"></a> `autoPromoteExtraction` | `readonly` | `boolean` | Auto-promotion policy (MCON-2). When `true`, the standard phase admits an injection-clean **extraction** fact as `active` instead of quarantined, so routine distillation surfaces in default recall without a manual `memory review --promote`. Injection-flagged facts always stay quarantined — the security gate is preserved — and episodes / insights / induced procedures are unaffected (they remain quarantined-until-validated). Defaults **off** at every tier: it trades the fail-safe default for convenience and is an explicit operator opt-in. | packages/memory/src/consolidator/types.ts:176 |
| <a id="property-budgetresetsemantics"></a> `budgetResetSemantics` | `readonly` | `"utc"` \| `"local"` \| `"sliding-24h"` | - | packages/memory/src/consolidator/types.ts:124 |
| <a id="property-ceilings"></a> `ceilings` | `readonly` | [`ConsolidatorCeilings`](/api/@graphorin/memory/interfaces/ConsolidatorCeilings.md) | - | packages/memory/src/consolidator/types.ts:109 |
| <a id="property-cheapmodel"></a> `cheapModel` | `readonly` | `string` \| `null` | Advisory label for the standard phase's model — recorded on spans / run telemetry only (MCON-7). Routing happens via `CreateConsolidatorOptions.cheapProvider`; this string disables nothing. | packages/memory/src/consolidator/types.ts:117 |
| <a id="property-contextualretrieval"></a> `contextualRetrieval` | `readonly` | [`ContextualRetrievalMode`](/api/@graphorin/memory/type-aliases/ContextualRetrievalMode.md) | Contextual retrieval for facts written by the standard phase (P1-3). `'late-chunk'` (default at every tier) relies on the offline situating-context prefix the shared [SemanticMemory](/api/@graphorin/memory/classes/SemanticMemory.md) computes for every write — no extra LLM call. `'llm'` is the opt-in enrichment: the standard phase spends one budgeted cheap-model call per additive write to author a 1–2 sentence situating prefix, then passes it as the write's index text. `'off'` indexes the bare text. The `'llm'` mode is **consolidator-only** by construction — the hot write path never has a provider for contextualization. | packages/memory/src/consolidator/types.ts:207 |
| <a id="property-decayarchivethreshold"></a> `decayArchiveThreshold` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:128 |
| <a id="property-decaycapacity"></a> `decayCapacity` | `readonly` | `number` \| `null` | Capacity-bounded eviction target for the light phase (X-1). When set, each light pass archives the lowest-salience live facts in the LRU decay window down to this many — **cost / staleness control, not an accuracy lever**. `null` (the default at every tier) leaves storage unbounded, so behaviour is identical to pre-X-1. Archiving is a soft, recoverable move; nothing is hard-deleted. | packages/memory/src/consolidator/types.ts:137 |
| <a id="property-decaytaudays"></a> `decayTauDays` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:127 |
| <a id="property-deepmodel"></a> `deepModel` | `readonly` | `string` \| `null` | Advisory label for the deep phase's model — telemetry only (MCON-7). Routing happens via `CreateConsolidatorOptions.deepProvider`. | packages/memory/src/consolidator/types.ts:123 |
| <a id="property-dlqbasebackoffms"></a> `dlqBaseBackoffMs` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:148 |
| <a id="property-dlqmaxbackoffms"></a> `dlqMaxBackoffMs` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:149 |
| <a id="property-dlqmaxretries"></a> `dlqMaxRetries` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:147 |
| <a id="property-formepisodes"></a> `formEpisodes` | `readonly` | `boolean` | Auto-form a quarantined episode from each processed standard-phase slice (P1-2). Defaults on at the `standard`+ tiers, off at `free` / `cheap` / `custom`. The episode summary is one budgeted LLM call; when the budget is exhausted (or no episodic tier is wired) the phase degrades to fact-only behaviour. | packages/memory/src/consolidator/types.ts:157 |
| <a id="property-importancescoring"></a> `importanceScoring` | `readonly` | `boolean` | Ask the episode-summarization call for an LLM importance score (1–10, normalized to `[0, 1]`) so episodic triple-signal retrieval (recency × relevance × importance) runs on all three signals (P1-2). Importance is always a *soft* signal — it never gates retention. Defaults track [formEpisodes](/api/@graphorin/memory/interfaces/ConsolidatorConfig.md#property-formepisodes). | packages/memory/src/consolidator/types.ts:165 |
| <a id="property-importancethreshold"></a> `importanceThreshold` | `readonly` | `number` | Sum of recent episode importance (each in `[0, 1]`) at or above which [reflection](/api/@graphorin/memory/interfaces/ConsolidatorConfig.md#property-reflection) fires. Below it the pass makes no LLM call. Defaults to `3`. | packages/memory/src/consolidator/types.ts:193 |
| <a id="property-lockwaitms"></a> `lockWaitMs` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:126 |
| <a id="property-maxdeepconflictsperrun"></a> `maxDeepConflictsPerRun` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:146 |
| <a id="property-maxstandardbatchsize"></a> `maxStandardBatchSize` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:145 |
| <a id="property-noisefilters"></a> `noiseFilters` | `readonly` | readonly (`"default"` \| `"minimal"` \| `"none"`)[] | - | packages/memory/src/consolidator/types.ts:125 |
| <a id="property-onexceed"></a> `onExceed` | `readonly` | [`OnBudgetExceed`](/api/@graphorin/memory/type-aliases/OnBudgetExceed.md) | - | packages/memory/src/consolidator/types.ts:110 |
| <a id="property-phases"></a> `phases` | `readonly` | readonly [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md)[] | - | packages/memory/src/consolidator/types.ts:108 |
| <a id="property-reflection"></a> `reflection` | `readonly` | `boolean` | Run the deep-phase reflection pass (P1-1): when accumulated episode importance crosses [importanceThreshold](/api/@graphorin/memory/interfaces/ConsolidatorConfig.md#property-importancethreshold), synthesize higher-order, cited insights over recent memories (Generative Agents). Insights land quarantined + `provenance: 'reflection'` and are ranked below the facts they cite. Defaults **on at the `full` tier only** (off at `free` / `cheap` / `standard` / `custom`) — it is the most LLM-intensive phase. A no-op without an episodic tier or an insight-capable storage adapter. | packages/memory/src/consolidator/types.ts:187 |
| <a id="property-reflectionmaxquestions"></a> `reflectionMaxQuestions` | `readonly` | `number` | Upper bound on salient questions reflection asks per pass. Defaults to `3`. | packages/memory/src/consolidator/types.ts:195 |
| <a id="property-salienceweights"></a> `salienceWeights` | `readonly` | `SalienceWeights` | Weights for the multi-signal salience score (X-1) that orders both threshold archiving and capacity eviction. Defaults to DEFAULT\_SALIENCE\_WEIGHTS; with neutral importance, active status, and first-party provenance salience equals plain retention. | packages/memory/src/consolidator/types.ts:144 |
| <a id="property-tier"></a> `tier` | `readonly` | [`ConsolidatorTier`](/api/@graphorin/memory/type-aliases/ConsolidatorTier.md) | - | packages/memory/src/consolidator/types.ts:107 |
| <a id="property-triggers"></a> `triggers` | `readonly` | readonly [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md)[] | - | packages/memory/src/consolidator/types.ts:106 |
