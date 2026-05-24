[**Graphorin API reference v0.3.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [facade](/api/@graphorin/memory/facade/index.md) / CreateMemoryOptions

# Interface: CreateMemoryOptions

Defined in: packages/memory/src/facade.ts:64

Options accepted by [createMemory](/api/@graphorin/memory/facade/functions/createMemory.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictpipeline"></a> `conflictPipeline?` | `readonly` | [`ConflictPipelineOptions`](/api/@graphorin/memory/interfaces/ConflictPipelineOptions.md) | Conflict pipeline configuration (Phase 10b). Default: enabled, English locale pack, thresholds `0.95 / 0.85 / 0.4`. Pass `{ mode: 'off' }` to bypass the pipeline entirely (logs a one-shot WARN per process per the spec). | packages/memory/src/facade.ts:128 |
| <a id="property-consolidator"></a> `consolidator?` | `readonly` | \{ `ceilings?`: `Partial`\&lt;[`ConsolidatorCeilings`](/api/@graphorin/memory/interfaces/ConsolidatorCeilings.md)\&gt;; `cheapModel?`: `string` \| `null`; `decayArchiveThreshold?`: `number`; `decayTauDays?`: `number`; `deepModel?`: `string` \| `null`; `defaultScope?`: [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md); `dlqBaseBackoffMs?`: `number`; `dlqMaxBackoffMs?`: `number`; `dlqMaxRetries?`: `number`; `enabled?`: `boolean`; `lockWaitMs?`: `number`; `maxDeepConflictsPerRun?`: `number`; `maxStandardBatchSize?`: `number`; `noiseFilters?`: readonly (`"default"` \| `"minimal"` \| `"none"`)[]; `now?`: () => `number`; `onExceed?`: [`OnBudgetExceed`](/api/@graphorin/memory/type-aliases/OnBudgetExceed.md); `onPhaseFinished?`: [`PhaseListener`](/api/@graphorin/memory/type-aliases/PhaseListener.md); `phases?`: readonly [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md)[]; `provider?`: [`Provider`](/api/@graphorin/core/interfaces/Provider.md) \| `null`; `randomId?`: () => `string`; `tier?`: [`ConsolidatorTier`](/api/@graphorin/memory/type-aliases/ConsolidatorTier.md); `triggers?`: readonly [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md)[]; \} | Consolidator configuration. When omitted (or `enabled: false`) the facade installs the Phase 10a no-op placeholder so consumers can still type their interactions without paying the runtime cost. Pass `enabled: true` (or any non-`tier: 'free'` settings) to construct the production runtime from `@graphorin/memory/consolidator`. | packages/memory/src/facade.ts:95 |
| `consolidator.ceilings?` | `readonly` | `Partial`\&lt;[`ConsolidatorCeilings`](/api/@graphorin/memory/interfaces/ConsolidatorCeilings.md)\&gt; | - | packages/memory/src/facade.ts:100 |
| `consolidator.cheapModel?` | `readonly` | `string` \| `null` | - | packages/memory/src/facade.ts:102 |
| `consolidator.decayArchiveThreshold?` | `readonly` | `number` | - | packages/memory/src/facade.ts:107 |
| `consolidator.decayTauDays?` | `readonly` | `number` | - | packages/memory/src/facade.ts:106 |
| `consolidator.deepModel?` | `readonly` | `string` \| `null` | - | packages/memory/src/facade.ts:103 |
| `consolidator.defaultScope?` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | - | packages/memory/src/facade.ts:113 |
| `consolidator.dlqBaseBackoffMs?` | `readonly` | `number` | - | packages/memory/src/facade.ts:111 |
| `consolidator.dlqMaxBackoffMs?` | `readonly` | `number` | - | packages/memory/src/facade.ts:112 |
| `consolidator.dlqMaxRetries?` | `readonly` | `number` | - | packages/memory/src/facade.ts:110 |
| `consolidator.enabled?` | `readonly` | `boolean` | - | packages/memory/src/facade.ts:96 |
| `consolidator.lockWaitMs?` | `readonly` | `number` | - | packages/memory/src/facade.ts:105 |
| `consolidator.maxDeepConflictsPerRun?` | `readonly` | `number` | - | packages/memory/src/facade.ts:109 |
| `consolidator.maxStandardBatchSize?` | `readonly` | `number` | - | packages/memory/src/facade.ts:108 |
| `consolidator.noiseFilters?` | `readonly` | readonly (`"default"` \| `"minimal"` \| `"none"`)[] | - | packages/memory/src/facade.ts:104 |
| `consolidator.now?` | `readonly` | () => `number` | Override the wall clock — used by tests. | packages/memory/src/facade.ts:116 |
| `consolidator.onExceed?` | `readonly` | [`OnBudgetExceed`](/api/@graphorin/memory/type-aliases/OnBudgetExceed.md) | - | packages/memory/src/facade.ts:101 |
| `consolidator.onPhaseFinished?` | `readonly` | [`PhaseListener`](/api/@graphorin/memory/type-aliases/PhaseListener.md) | Subscribe to phase-finished events. | packages/memory/src/facade.ts:120 |
| `consolidator.phases?` | `readonly` | readonly [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md)[] | - | packages/memory/src/facade.ts:99 |
| `consolidator.provider?` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) \| `null` | - | packages/memory/src/facade.ts:114 |
| `consolidator.randomId?` | `readonly` | () => `string` | Stable id seed — used by tests. | packages/memory/src/facade.ts:118 |
| `consolidator.tier?` | `readonly` | [`ConsolidatorTier`](/api/@graphorin/memory/type-aliases/ConsolidatorTier.md) | - | packages/memory/src/facade.ts:98 |
| `consolidator.triggers?` | `readonly` | readonly [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md)[] | - | packages/memory/src/facade.ts:97 |
| <a id="property-contextengine"></a> `contextEngine?` | `readonly` | [`ContextEngineConfig`](/api/@graphorin/memory/interfaces/ContextEngineConfig.md) | Context engine configuration (Phase 10d). The engine assembles the layered six-layer system prompt; `memory.compile(scope)` delegates to it for the working blocks + rules + metadata fragments. When omitted, a default engine is created (English locale; `'full'` base mode; no auto-recall; conservative `'public-tls'` provider trust). | packages/memory/src/facade.ts:137 |
| <a id="property-embedder"></a> `embedder?` | `readonly` | [`EmbedderProvider`](/api/@graphorin/core/interfaces/EmbedderProvider.md) | Embedder provider (default: none — vector search is disabled). | packages/memory/src/facade.ts:70 |
| <a id="property-embeddings"></a> `embeddings` | `readonly` | [`EmbeddingMetaRegistryLike`](/api/@graphorin/memory/interfaces/EmbeddingMetaRegistryLike.md) | Embedder registry. The default sqlite store exposes one as `sqlite.embeddings`. | packages/memory/src/facade.ts:68 |
| <a id="property-reranker"></a> `reranker?` | `readonly` | [`ReRanker`](/api/@graphorin/memory/interfaces/ReRanker.md) | Override the reranker used by `SemanticMemory.search`. | packages/memory/src/facade.ts:80 |
| <a id="property-resolvescope"></a> `resolveScope?` | `readonly` | [`ScopeResolver`](/api/@graphorin/memory/type-aliases/ScopeResolver.md) | Resolver that produces the live [SessionScope](/api/@graphorin/core/interfaces/SessionScope.md) for each memory-tool invocation. Defaults to a closure that throws — the agent runtime overrides it in Phase 12. | packages/memory/src/facade.ts:86 |
| <a id="property-store"></a> `store` | `readonly` | [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md) | Storage adapter (default: `@graphorin/store-sqlite`'s `MemoryStore`). | packages/memory/src/facade.ts:66 |
| <a id="property-tracer"></a> `tracer?` | `readonly` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) | Tracer used for every `memory.*` span. Defaults to the no-op tracer from `@graphorin/core` so unit tests do not need to wire the observability stack. | packages/memory/src/facade.ts:78 |
| <a id="property-workingblocks"></a> `workingBlocks?` | `readonly` | readonly [`BlockDefinition`](/api/@graphorin/memory/interfaces/BlockDefinition.md)[] | Pre-declared working blocks (idempotent — re-defining is a no-op). | packages/memory/src/facade.ts:72 |
