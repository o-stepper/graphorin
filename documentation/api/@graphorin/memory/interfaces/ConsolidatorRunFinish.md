[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorRunFinish

# Interface: ConsolidatorRunFinish

Defined in: [packages/memory/src/internal/storage-adapter.ts:488](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L488)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictsresolved"></a> `conflictsResolved?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:496](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L496) |
| <a id="property-emptyextractions"></a> `emptyExtractions?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:498](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L498) |
| <a id="property-episodesformed"></a> `episodesFormed?` | `readonly` | `number` | Episodes auto-formed by the run (P1-2 / MCON-17). | [packages/memory/src/internal/storage-adapter.ts:500](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L500) |
| <a id="property-errormessage"></a> `errorMessage?` | `readonly` | `string` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:503](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L503) |
| <a id="property-factscreated"></a> `factsCreated?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:494](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L494) |
| <a id="property-factsupdated"></a> `factsUpdated?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:495](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L495) |
| <a id="property-finishedat"></a> `finishedAt` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:490](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L490) |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [packages/memory/src/internal/storage-adapter.ts:489](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L489) |
| <a id="property-insightscreated"></a> `insightsCreated?` | `readonly` | `number` | Insights synthesized by the run's reflection pass (P1-1 / MCON-17). | [packages/memory/src/internal/storage-adapter.ts:502](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L502) |
| <a id="property-llmcostusd"></a> `llmCostUsd?` | `readonly` | `number` \| `null` | - | [packages/memory/src/internal/storage-adapter.ts:493](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L493) |
| <a id="property-llmtokensused"></a> `llmTokensUsed?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:492](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L492) |
| <a id="property-noisefilteredcount"></a> `noiseFilteredCount?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:497](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L497) |
| <a id="property-retrycount"></a> `retryCount?` | `readonly` | `number` | - | [packages/memory/src/internal/storage-adapter.ts:504](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L504) |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"deferred"` \| `"partial"` | - | [packages/memory/src/internal/storage-adapter.ts:491](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/storage-adapter.ts#L491) |
