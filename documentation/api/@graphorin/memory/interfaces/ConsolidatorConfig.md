[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorConfig

# Interface: ConsolidatorConfig

Defined in: packages/memory/src/consolidator/types.ts:89

Locked-down configuration accepted by `createConsolidator(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-budgetattribution"></a> `budgetAttribution` | `readonly` | `"shared"` \| `"per-trigger"` | - | packages/memory/src/consolidator/types.ts:100 |
| <a id="property-budgetresetsemantics"></a> `budgetResetSemantics` | `readonly` | `"utc"` \| `"local"` \| `"sliding-24h"` | - | packages/memory/src/consolidator/types.ts:99 |
| <a id="property-ceilings"></a> `ceilings` | `readonly` | [`ConsolidatorCeilings`](/api/@graphorin/memory/interfaces/ConsolidatorCeilings.md) | - | packages/memory/src/consolidator/types.ts:93 |
| <a id="property-cheapmodel"></a> `cheapModel` | `readonly` | `string` \| `null` | Cheap-model identifier used by the standard phase. `null` disables. | packages/memory/src/consolidator/types.ts:96 |
| <a id="property-decayarchivethreshold"></a> `decayArchiveThreshold` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:104 |
| <a id="property-decaytaudays"></a> `decayTauDays` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:103 |
| <a id="property-deepmodel"></a> `deepModel` | `readonly` | `string` \| `null` | Deep-model identifier used by the deep phase. `null` disables. | packages/memory/src/consolidator/types.ts:98 |
| <a id="property-dlqbasebackoffms"></a> `dlqBaseBackoffMs` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:108 |
| <a id="property-dlqmaxbackoffms"></a> `dlqMaxBackoffMs` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:109 |
| <a id="property-dlqmaxretries"></a> `dlqMaxRetries` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:107 |
| <a id="property-lockwaitms"></a> `lockWaitMs` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:102 |
| <a id="property-maxdeepconflictsperrun"></a> `maxDeepConflictsPerRun` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:106 |
| <a id="property-maxstandardbatchsize"></a> `maxStandardBatchSize` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:105 |
| <a id="property-noisefilters"></a> `noiseFilters` | `readonly` | readonly (`"default"` \| `"minimal"` \| `"none"`)[] | - | packages/memory/src/consolidator/types.ts:101 |
| <a id="property-onexceed"></a> `onExceed` | `readonly` | [`OnBudgetExceed`](/api/@graphorin/memory/type-aliases/OnBudgetExceed.md) | - | packages/memory/src/consolidator/types.ts:94 |
| <a id="property-phases"></a> `phases` | `readonly` | readonly [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md)[] | - | packages/memory/src/consolidator/types.ts:92 |
| <a id="property-tier"></a> `tier` | `readonly` | [`ConsolidatorTier`](/api/@graphorin/memory/type-aliases/ConsolidatorTier.md) | - | packages/memory/src/consolidator/types.ts:91 |
| <a id="property-triggers"></a> `triggers` | `readonly` | readonly [`ConsolidatorTriggerSpec`](/api/@graphorin/memory/type-aliases/ConsolidatorTriggerSpec.md)[] | - | packages/memory/src/consolidator/types.ts:90 |
