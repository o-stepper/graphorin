[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorRunFinish

# Interface: ConsolidatorRunFinish

Defined in: [packages/memory/src/internal/storage-adapter.ts:438](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L438)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictsresolved"></a> `conflictsResolved?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:446](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L446) |
| <a id="property-emptyextractions"></a> `emptyExtractions?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:448](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L448) |
| <a id="property-episodesformed"></a> `episodesFormed?` | `readonly` | `number` | Episodes auto-formed by the run (P1-2 / MCON-17). | [packages/memory/src/internal/storage-adapter.ts:450](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L450) |
| <a id="property-errormessage"></a> `errorMessage?` | `readonly` | `string` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:453](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L453) |
| <a id="property-factscreated"></a> `factsCreated?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:444](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L444) |
| <a id="property-factsupdated"></a> `factsUpdated?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:445](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L445) |
| <a id="property-finishedat"></a> `finishedAt` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:440](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L440) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:439](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L439) |
| <a id="property-insightscreated"></a> `insightsCreated?` | `readonly` | `number` | Insights synthesized by the run's reflection pass (P1-1 / MCON-17). | [packages/memory/src/internal/storage-adapter.ts:452](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L452) |
| <a id="property-llmcostusd"></a> `llmCostUsd?` | `readonly` | `number` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:443](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L443) |
| <a id="property-llmtokensused"></a> `llmTokensUsed?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:442](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L442) |
| <a id="property-noisefilteredcount"></a> `noiseFilteredCount?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:447](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L447) |
| <a id="property-retrycount"></a> `retryCount?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:454](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L454) |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"deferred"` \| `"partial"` | - | [packages/memory/src/internal/storage-adapter.ts:441](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L441) |
