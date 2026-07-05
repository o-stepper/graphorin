[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CreateConsolidatorOptions

# Interface: CreateConsolidatorOptions

Defined in: packages/memory/src/consolidator/types.ts:340

Options accepted by [createConsolidator](/api/@graphorin/memory/functions/createConsolidator.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-autopromoteextraction"></a> `autoPromoteExtraction?` | `readonly` | `boolean` | Opt in to auto-promotion of injection-clean extraction facts (MCON-2). Defaults `false`. See [ConsolidatorConfig.autoPromoteExtraction](/api/@graphorin/memory/interfaces/ConsolidatorConfig.md#property-autopromoteextraction). | packages/memory/src/consolidator/types.ts:432 |
| <a id="property-budgetresetsemantics"></a> `budgetResetSemantics?` | `readonly` | `"utc"` \| `"local"` \| `"sliding-24h"` | - | packages/memory/src/consolidator/types.ts:410 |
| <a id="property-ceilings"></a> `ceilings?` | `readonly` | `Partial`\&lt;[`ConsolidatorCeilings`](/api/@graphorin/memory/interfaces/ConsolidatorCeilings.md)\&gt; | - | packages/memory/src/consolidator/types.ts:382 |
| <a id="property-cheapmodel"></a> `cheapModel?` | `readonly` | `string` \| `null` | - | packages/memory/src/consolidator/types.ts:408 |
| <a id="property-cheapprovider"></a> `cheapProvider?` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) \| `null` | Provider routed to the standard phase (extraction / episode / reconcile / situating-context calls) when set (MCON-7). Falls back to `provider`. Pair with `cheapModel` for the telemetry label. | packages/memory/src/consolidator/types.ts:402 |
| <a id="property-contextualretrieval"></a> `contextualRetrieval?` | `readonly` | [`ContextualRetrievalMode`](/api/@graphorin/memory/type-aliases/ContextualRetrievalMode.md) | Override the per-tier [ConsolidatorConfig.contextualRetrieval](/api/@graphorin/memory/interfaces/ConsolidatorConfig.md#property-contextualretrieval) default (P1-3). | packages/memory/src/consolidator/types.ts:440 |
| <a id="property-decayarchivethreshold"></a> `decayArchiveThreshold?` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:414 |
| <a id="property-decaycapacity"></a> `decayCapacity?` | `readonly` | `number` \| `null` | Override the [ConsolidatorConfig.decayCapacity](/api/@graphorin/memory/interfaces/ConsolidatorConfig.md#property-decaycapacity) default (X-1). | packages/memory/src/consolidator/types.ts:416 |
| <a id="property-decaytaudays"></a> `decayTauDays?` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:413 |
| <a id="property-deepmodel"></a> `deepModel?` | `readonly` | `string` \| `null` | - | packages/memory/src/consolidator/types.ts:409 |
| <a id="property-deepprovider"></a> `deepProvider?` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) \| `null` | Provider routed to the deep phase (conflict judge) and the reflection pass when set (MCON-7). Falls back to `provider`. | packages/memory/src/consolidator/types.ts:407 |
| <a id="property-defaultscope"></a> `defaultScope?` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | Default scope used by event triggers + the manual `fireNow` path. | packages/memory/src/consolidator/types.ts:446 |
| <a id="property-dlqbasebackoffms"></a> `dlqBaseBackoffMs?` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:422 |
| <a id="property-dlqmaxbackoffms"></a> `dlqMaxBackoffMs?` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:423 |
| <a id="property-dlqmaxretries"></a> `dlqMaxRetries?` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:421 |
| <a id="property-episodic"></a> `episodic?` | `readonly` | [`EpisodicMemory`](/api/@graphorin/memory/classes/EpisodicMemory.md) | The [EpisodicMemory](/api/@graphorin/memory/classes/EpisodicMemory.md) tier instance from the parent `createMemory(...)` facade. When supplied (and `formEpisodes` is on) the standard phase auto-forms a quarantined episode per processed slice (P1-2). Omitted ⇒ episode formation is skipped. | packages/memory/src/consolidator/types.ts:360 |
| <a id="property-formepisodes"></a> `formEpisodes?` | `readonly` | `boolean` | Override the per-tier [ConsolidatorConfig.formEpisodes](/api/@graphorin/memory/interfaces/ConsolidatorConfig.md#property-formepisodes) default (P1-2). | packages/memory/src/consolidator/types.ts:425 |
| <a id="property-importancescoring"></a> `importanceScoring?` | `readonly` | `boolean` | Override the per-tier [ConsolidatorConfig.importanceScoring](/api/@graphorin/memory/interfaces/ConsolidatorConfig.md#property-importancescoring) default (P1-2). | packages/memory/src/consolidator/types.ts:427 |
| <a id="property-importancethreshold"></a> `importanceThreshold?` | `readonly` | `number` | Override the [ConsolidatorConfig.importanceThreshold](/api/@graphorin/memory/interfaces/ConsolidatorConfig.md#property-importancethreshold) default (P1-1). | packages/memory/src/consolidator/types.ts:436 |
| <a id="property-learnedcontext"></a> `learnedContext?` | `readonly` | `boolean` | Override the per-tier [ConsolidatorConfig.learnedContext](/api/@graphorin/memory/interfaces/ConsolidatorConfig.md#property-learnedcontext) default (D3). | packages/memory/src/consolidator/types.ts:442 |
| <a id="property-learnedcontextmaxchars"></a> `learnedContextMaxChars?` | `readonly` | `number` | Override the [ConsolidatorConfig.learnedContextMaxChars](/api/@graphorin/memory/interfaces/ConsolidatorConfig.md#property-learnedcontextmaxchars) default (D3). | packages/memory/src/consolidator/types.ts:444 |
| <a id="property-lockwaitms"></a> `lockWaitMs?` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:412 |
| <a id="property-maxdeepconflictsperrun"></a> `maxDeepConflictsPerRun?` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:420 |
| <a id="property-maxstandardbatchsize"></a> `maxStandardBatchSize?` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:419 |
| <a id="property-noisefilters"></a> `noiseFilters?` | `readonly` | readonly (`"default"` \| `"minimal"` \| `"none"`)[] | - | packages/memory/src/consolidator/types.ts:411 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Override the wall clock - used by tests. | packages/memory/src/consolidator/types.ts:376 |
| <a id="property-onexceed"></a> `onExceed?` | `readonly` | [`OnBudgetExceed`](/api/@graphorin/memory/type-aliases/OnBudgetExceed.md) | - | packages/memory/src/consolidator/types.ts:383 |
| <a id="property-phases"></a> `phases?` | `readonly` | readonly [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md)[] | - | packages/memory/src/consolidator/types.ts:381 |
| <a id="property-priceusage"></a> `priceUsage?` | `readonly` | (`usage`) => `number` | USD pricer for phase LLM usage (memory-consolidation-02). Wire it to `@graphorin/pricing`'s `calculateCost` (or any per-token rate) so the `maxCostPerDay` ceiling can actually accumulate spend - without it every phase prices its calls at $0 and the USD ceiling never trips at any tier. `priceUsage: ({ promptTokens, completionTokens }) => (promptTokens * 3 + completionTokens * 15) / 1_000_000` | packages/memory/src/consolidator/types.ts:396 |
| <a id="property-provider"></a> `provider?` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) \| `null` | Provider used by the standard + deep phases. Required when the tier enables either phase; ignored when the active phases collapse to `['light']`. | packages/memory/src/consolidator/types.ts:373 |
| <a id="property-randomid"></a> `randomId?` | `readonly` | () => `string` | Random source for stable run ids - used by tests. | packages/memory/src/consolidator/types.ts:378 |
| <a id="property-reflection"></a> `reflection?` | `readonly` | `boolean` | Override the per-tier [ConsolidatorConfig.reflection](/api/@graphorin/memory/interfaces/ConsolidatorConfig.md#property-reflection) default (P1-1). | packages/memory/src/consolidator/types.ts:434 |
| <a id="property-reflectionmaxquestions"></a> `reflectionMaxQuestions?` | `readonly` | `number` | Override the [ConsolidatorConfig.reflectionMaxQuestions](/api/@graphorin/memory/interfaces/ConsolidatorConfig.md#property-reflectionmaxquestions) default (P1-1). | packages/memory/src/consolidator/types.ts:438 |
| <a id="property-salienceweights"></a> `salienceWeights?` | `readonly` | `SalienceWeights` | Override the [ConsolidatorConfig.salienceWeights](/api/@graphorin/memory/interfaces/ConsolidatorConfig.md#property-salienceweights) default (X-1). | packages/memory/src/consolidator/types.ts:418 |
| <a id="property-semantic"></a> `semantic` | `readonly` | [`SemanticMemory`](/api/@graphorin/memory/classes/SemanticMemory.md) | The [SemanticMemory](/api/@graphorin/memory/classes/SemanticMemory.md) tier instance from the parent `createMemory(...)` facade. The standard phase routes every extracted fact through `semantic.remember(...)` so the conflict pipeline (Phase 10b) handles dedup / supersede. | packages/memory/src/consolidator/types.ts:353 |
| <a id="property-store"></a> `store` | `readonly` | [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md) | Storage adapter - supplies the consolidator state, runs, DLQ, and per-tier helpers. The default `@graphorin/store-sqlite` adapter exposes everything by construction. | packages/memory/src/consolidator/types.ts:346 |
| <a id="property-tier"></a> `tier?` | `readonly` | [`ConsolidatorTier`](/api/@graphorin/memory/type-aliases/ConsolidatorTier.md) | - | packages/memory/src/consolidator/types.ts:380 |
| <a id="property-tracer"></a> `tracer?` | `readonly` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) | - | packages/memory/src/consolidator/types.ts:374 |
| <a id="property-triggers"></a> `triggers?` | `readonly` | readonly [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md)[] | - | packages/memory/src/consolidator/types.ts:379 |
| <a id="property-working"></a> `working?` | `readonly` | [`WorkingMemory`](/api/@graphorin/memory/classes/WorkingMemory.md) | The [WorkingMemory](/api/@graphorin/memory/classes/WorkingMemory.md) tier instance from the parent `createMemory(...)` facade (D3). Required for the learned-context pass - without it the pass is a silent no-op even when `learnedContext` is enabled. | packages/memory/src/consolidator/types.ts:367 |
