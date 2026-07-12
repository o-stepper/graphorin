[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorRunFinish

# Interface: ConsolidatorRunFinish

Defined in: [packages/memory/src/internal/storage-adapter.ts:453](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L453)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictsresolved"></a> `conflictsResolved?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:461](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L461) |
| <a id="property-emptyextractions"></a> `emptyExtractions?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:463](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L463) |
| <a id="property-episodesformed"></a> `episodesFormed?` | `readonly` | `number` | Episodes auto-formed by the run (P1-2 / MCON-17). | [packages/memory/src/internal/storage-adapter.ts:465](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L465) |
| <a id="property-errormessage"></a> `errorMessage?` | `readonly` | `string` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:468](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L468) |
| <a id="property-factscreated"></a> `factsCreated?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:459](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L459) |
| <a id="property-factsupdated"></a> `factsUpdated?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:460](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L460) |
| <a id="property-finishedat"></a> `finishedAt` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:455](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L455) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:454](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L454) |
| <a id="property-insightscreated"></a> `insightsCreated?` | `readonly` | `number` | Insights synthesized by the run's reflection pass (P1-1 / MCON-17). | [packages/memory/src/internal/storage-adapter.ts:467](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L467) |
| <a id="property-llmcostusd"></a> `llmCostUsd?` | `readonly` | `number` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:458](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L458) |
| <a id="property-llmtokensused"></a> `llmTokensUsed?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:457](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L457) |
| <a id="property-noisefilteredcount"></a> `noiseFilteredCount?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:462](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L462) |
| <a id="property-retrycount"></a> `retryCount?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:469](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L469) |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"deferred"` \| `"partial"` | - | [packages/memory/src/internal/storage-adapter.ts:456](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L456) |
