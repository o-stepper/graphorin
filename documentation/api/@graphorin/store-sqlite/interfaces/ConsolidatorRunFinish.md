[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / ConsolidatorRunFinish

# Interface: ConsolidatorRunFinish

Defined in: [packages/store-sqlite/src/consolidator-store.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L61)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictsresolved"></a> `conflictsResolved?` | `readonly` | `number` | - | [packages/store-sqlite/src/consolidator-store.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L69) |
| <a id="property-emptyextractions"></a> `emptyExtractions?` | `readonly` | `number` | - | [packages/store-sqlite/src/consolidator-store.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L71) |
| <a id="property-episodesformed"></a> `episodesFormed?` | `readonly` | `number` | Episodes auto-formed by the run (P1-2 / MCON-17). | [packages/store-sqlite/src/consolidator-store.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L73) |
| <a id="property-errormessage"></a> `errorMessage?` | `readonly` | `string` \| `null` | - | [packages/store-sqlite/src/consolidator-store.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L76) |
| <a id="property-factscreated"></a> `factsCreated?` | `readonly` | `number` | - | [packages/store-sqlite/src/consolidator-store.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L67) |
| <a id="property-factsupdated"></a> `factsUpdated?` | `readonly` | `number` | - | [packages/store-sqlite/src/consolidator-store.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L68) |
| <a id="property-finishedat"></a> `finishedAt` | `readonly` | `number` | - | [packages/store-sqlite/src/consolidator-store.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L63) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/store-sqlite/src/consolidator-store.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L62) |
| <a id="property-insightscreated"></a> `insightsCreated?` | `readonly` | `number` | Insights synthesized by the run's reflection pass (P1-1 / MCON-17). | [packages/store-sqlite/src/consolidator-store.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L75) |
| <a id="property-llmcostusd"></a> `llmCostUsd?` | `readonly` | `number` \| `null` | - | [packages/store-sqlite/src/consolidator-store.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L66) |
| <a id="property-llmtokensused"></a> `llmTokensUsed?` | `readonly` | `number` | - | [packages/store-sqlite/src/consolidator-store.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L65) |
| <a id="property-noisefilteredcount"></a> `noiseFilteredCount?` | `readonly` | `number` | - | [packages/store-sqlite/src/consolidator-store.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L70) |
| <a id="property-retrycount"></a> `retryCount?` | `readonly` | `number` | - | [packages/store-sqlite/src/consolidator-store.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L77) |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"deferred"` \| `"partial"` | - | [packages/store-sqlite/src/consolidator-store.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/consolidator-store.ts#L64) |
