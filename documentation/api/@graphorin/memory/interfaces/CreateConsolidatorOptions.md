[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CreateConsolidatorOptions

# Interface: CreateConsolidatorOptions

Defined in: packages/memory/src/consolidator/types.ts:219

Options accepted by [createConsolidator](/api/@graphorin/memory/functions/createConsolidator.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-budgetattribution"></a> `budgetAttribution?` | `readonly` | `"shared"` \| `"per-trigger"` | - | packages/memory/src/consolidator/types.ts:252 |
| <a id="property-budgetresetsemantics"></a> `budgetResetSemantics?` | `readonly` | `"utc"` \| `"local"` \| `"sliding-24h"` | - | packages/memory/src/consolidator/types.ts:251 |
| <a id="property-ceilings"></a> `ceilings?` | `readonly` | `Partial`\&lt;[`ConsolidatorCeilings`](/api/@graphorin/memory/interfaces/ConsolidatorCeilings.md)\&gt; | - | packages/memory/src/consolidator/types.ts:247 |
| <a id="property-cheapmodel"></a> `cheapModel?` | `readonly` | `string` \| `null` | - | packages/memory/src/consolidator/types.ts:249 |
| <a id="property-decayarchivethreshold"></a> `decayArchiveThreshold?` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:256 |
| <a id="property-decaytaudays"></a> `decayTauDays?` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:255 |
| <a id="property-deepmodel"></a> `deepModel?` | `readonly` | `string` \| `null` | - | packages/memory/src/consolidator/types.ts:250 |
| <a id="property-defaultscope"></a> `defaultScope?` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | Default scope used by event triggers + the manual `fireNow` path. | packages/memory/src/consolidator/types.ts:263 |
| <a id="property-dlqbasebackoffms"></a> `dlqBaseBackoffMs?` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:260 |
| <a id="property-dlqmaxbackoffms"></a> `dlqMaxBackoffMs?` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:261 |
| <a id="property-dlqmaxretries"></a> `dlqMaxRetries?` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:259 |
| <a id="property-lockwaitms"></a> `lockWaitMs?` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:254 |
| <a id="property-maxdeepconflictsperrun"></a> `maxDeepConflictsPerRun?` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:258 |
| <a id="property-maxstandardbatchsize"></a> `maxStandardBatchSize?` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:257 |
| <a id="property-noisefilters"></a> `noiseFilters?` | `readonly` | readonly (`"default"` \| `"minimal"` \| `"none"`)[] | - | packages/memory/src/consolidator/types.ts:253 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Override the wall clock — used by tests. | packages/memory/src/consolidator/types.ts:241 |
| <a id="property-onexceed"></a> `onExceed?` | `readonly` | [`OnBudgetExceed`](/api/@graphorin/memory/type-aliases/OnBudgetExceed.md) | - | packages/memory/src/consolidator/types.ts:248 |
| <a id="property-phases"></a> `phases?` | `readonly` | readonly [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md)[] | - | packages/memory/src/consolidator/types.ts:246 |
| <a id="property-provider"></a> `provider?` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) \| `null` | Provider used by the standard + deep phases. Required when the tier enables either phase; ignored when the active phases collapse to `['light']`. | packages/memory/src/consolidator/types.ts:238 |
| <a id="property-randomid"></a> `randomId?` | `readonly` | () => `string` | Random source for stable run ids — used by tests. | packages/memory/src/consolidator/types.ts:243 |
| <a id="property-semantic"></a> `semantic` | `readonly` | [`SemanticMemory`](/api/@graphorin/memory/classes/SemanticMemory.md) | The [SemanticMemory](/api/@graphorin/memory/classes/SemanticMemory.md) tier instance from the parent `createMemory(...)` facade. The standard phase routes every extracted fact through `semantic.remember(...)` so the conflict pipeline (Phase 10b) handles dedup / supersede. | packages/memory/src/consolidator/types.ts:232 |
| <a id="property-store"></a> `store` | `readonly` | [`MemoryStoreAdapter`](/api/@graphorin/memory/interfaces/MemoryStoreAdapter.md) | Storage adapter — supplies the consolidator state, runs, DLQ, and per-tier helpers. The default `@graphorin/store-sqlite` adapter exposes everything by construction. | packages/memory/src/consolidator/types.ts:225 |
| <a id="property-tier"></a> `tier?` | `readonly` | [`ConsolidatorTier`](/api/@graphorin/memory/type-aliases/ConsolidatorTier.md) | - | packages/memory/src/consolidator/types.ts:245 |
| <a id="property-tracer"></a> `tracer?` | `readonly` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) | - | packages/memory/src/consolidator/types.ts:239 |
| <a id="property-triggers"></a> `triggers?` | `readonly` | readonly [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md)[] | - | packages/memory/src/consolidator/types.ts:244 |
