[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorRunFinish

# Interface: ConsolidatorRunFinish

Defined in: packages/memory/src/internal/storage-adapter.ts:488

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictsresolved"></a> `conflictsResolved?` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:496 |
| <a id="property-emptyextractions"></a> `emptyExtractions?` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:498 |
| <a id="property-episodesformed"></a> `episodesFormed?` | `readonly` | `number` | Episodes auto-formed by the run. | packages/memory/src/internal/storage-adapter.ts:500 |
| <a id="property-errormessage"></a> `errorMessage?` | `readonly` | `string` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:503 |
| <a id="property-factscreated"></a> `factsCreated?` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:494 |
| <a id="property-factsupdated"></a> `factsUpdated?` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:495 |
| <a id="property-finishedat"></a> `finishedAt` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:490 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:489 |
| <a id="property-insightscreated"></a> `insightsCreated?` | `readonly` | `number` | Insights synthesized by the run's reflection pass. | packages/memory/src/internal/storage-adapter.ts:502 |
| <a id="property-llmcostusd"></a> `llmCostUsd?` | `readonly` | `number` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:493 |
| <a id="property-llmtokensused"></a> `llmTokensUsed?` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:492 |
| <a id="property-noisefilteredcount"></a> `noiseFilteredCount?` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:497 |
| <a id="property-retrycount"></a> `retryCount?` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:504 |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"deferred"` \| `"partial"` | - | packages/memory/src/internal/storage-adapter.ts:491 |
