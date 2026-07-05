[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorRunFinish

# Interface: ConsolidatorRunFinish

Defined in: packages/memory/src/internal/storage-adapter.ts:425

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictsresolved"></a> `conflictsResolved?` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:433 |
| <a id="property-emptyextractions"></a> `emptyExtractions?` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:435 |
| <a id="property-episodesformed"></a> `episodesFormed?` | `readonly` | `number` | Episodes auto-formed by the run (P1-2 / MCON-17). | packages/memory/src/internal/storage-adapter.ts:437 |
| <a id="property-errormessage"></a> `errorMessage?` | `readonly` | `string` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:440 |
| <a id="property-factscreated"></a> `factsCreated?` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:431 |
| <a id="property-factsupdated"></a> `factsUpdated?` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:432 |
| <a id="property-finishedat"></a> `finishedAt` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:427 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/memory/src/internal/storage-adapter.ts:426 |
| <a id="property-insightscreated"></a> `insightsCreated?` | `readonly` | `number` | Insights synthesized by the run's reflection pass (P1-1 / MCON-17). | packages/memory/src/internal/storage-adapter.ts:439 |
| <a id="property-llmcostusd"></a> `llmCostUsd?` | `readonly` | `number` \| `null` | - | packages/memory/src/internal/storage-adapter.ts:430 |
| <a id="property-llmtokensused"></a> `llmTokensUsed?` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:429 |
| <a id="property-noisefilteredcount"></a> `noiseFilteredCount?` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:434 |
| <a id="property-retrycount"></a> `retryCount?` | `readonly` | `number` | - | packages/memory/src/internal/storage-adapter.ts:441 |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"deferred"` \| `"partial"` | - | packages/memory/src/internal/storage-adapter.ts:428 |
