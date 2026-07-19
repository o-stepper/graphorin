[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PhaseOutcome

# Interface: PhaseOutcome

Defined in: packages/memory/src/consolidator/types.ts:393

**`Stable`**

Outcome surfaced by every phase invocation. Recorded into
`consolidator_runs` and emitted on the AISpan.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictsresolved"></a> `conflictsResolved` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:398 |
| <a id="property-curatedblocksupdated"></a> `curatedBlocksUpdated?` | `readonly` | `number` | How many curated blocks were rewritten this pass. | packages/memory/src/consolidator/types.ts:406 |
| <a id="property-emptyextractions"></a> `emptyExtractions` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:412 |
| <a id="property-episodesformed"></a> `episodesFormed` | `readonly` | `number` | Episodes auto-formed from the processed slice. | packages/memory/src/consolidator/types.ts:400 |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` \| `null` | - | packages/memory/src/consolidator/types.ts:415 |
| <a id="property-factscreated"></a> `factsCreated` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:396 |
| <a id="property-factspromoted"></a> `factsPromoted?` | `readonly` | `number` | Facts promoted out of quarantine by the promotion step. | packages/memory/src/consolidator/types.ts:410 |
| <a id="property-factsupdated"></a> `factsUpdated` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:397 |
| <a id="property-insightscreated"></a> `insightsCreated` | `readonly` | `number` | Insights synthesized by the deep-phase reflection pass. | packages/memory/src/consolidator/types.ts:402 |
| <a id="property-learnedcontextupdated"></a> `learnedContextUpdated?` | `readonly` | `boolean` | True when the learned-context digest block was rewritten. | packages/memory/src/consolidator/types.ts:404 |
| <a id="property-llmcostusd"></a> `llmCostUsd` | `readonly` | `number` \| `null` | - | packages/memory/src/consolidator/types.ts:414 |
| <a id="property-llmtokensused"></a> `llmTokensUsed` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:413 |
| <a id="property-noisefilteredcount"></a> `noiseFilteredCount` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:411 |
| <a id="property-phase"></a> `phase` | `readonly` | [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md) | - | packages/memory/src/consolidator/types.ts:394 |
| <a id="property-profileprojectionupdated"></a> `profileProjectionUpdated?` | `readonly` | `boolean` | True when the profile block content changed. | packages/memory/src/consolidator/types.ts:408 |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"deferred"` \| `"partial"` | - | packages/memory/src/consolidator/types.ts:395 |
