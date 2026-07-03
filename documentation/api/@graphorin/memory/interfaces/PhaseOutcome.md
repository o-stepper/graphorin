[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PhaseOutcome

# Interface: PhaseOutcome

Defined in: packages/memory/src/consolidator/types.ts:286

Outcome surfaced by every phase invocation. Recorded into
`consolidator_runs` and emitted on the AISpan.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictsresolved"></a> `conflictsResolved` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:291 |
| <a id="property-emptyextractions"></a> `emptyExtractions` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:297 |
| <a id="property-episodesformed"></a> `episodesFormed` | `readonly` | `number` | Episodes auto-formed from the processed slice (P1-2). | packages/memory/src/consolidator/types.ts:293 |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` \| `null` | - | packages/memory/src/consolidator/types.ts:300 |
| <a id="property-factscreated"></a> `factsCreated` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:289 |
| <a id="property-factsupdated"></a> `factsUpdated` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:290 |
| <a id="property-insightscreated"></a> `insightsCreated` | `readonly` | `number` | Insights synthesized by the deep-phase reflection pass (P1-1). | packages/memory/src/consolidator/types.ts:295 |
| <a id="property-llmcostusd"></a> `llmCostUsd` | `readonly` | `number` \| `null` | - | packages/memory/src/consolidator/types.ts:299 |
| <a id="property-llmtokensused"></a> `llmTokensUsed` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:298 |
| <a id="property-noisefilteredcount"></a> `noiseFilteredCount` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:296 |
| <a id="property-phase"></a> `phase` | `readonly` | [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md) | - | packages/memory/src/consolidator/types.ts:287 |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"deferred"` \| `"partial"` | - | packages/memory/src/consolidator/types.ts:288 |
