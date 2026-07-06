[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PhaseOutcome

# Interface: PhaseOutcome

Defined in: packages/memory/src/consolidator/types.ts:325

Outcome surfaced by every phase invocation. Recorded into
`consolidator_runs` and emitted on the AISpan.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictsresolved"></a> `conflictsResolved` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:330 |
| <a id="property-emptyextractions"></a> `emptyExtractions` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:338 |
| <a id="property-episodesformed"></a> `episodesFormed` | `readonly` | `number` | Episodes auto-formed from the processed slice (P1-2). | packages/memory/src/consolidator/types.ts:332 |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` \| `null` | - | packages/memory/src/consolidator/types.ts:341 |
| <a id="property-factscreated"></a> `factsCreated` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:328 |
| <a id="property-factsupdated"></a> `factsUpdated` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:329 |
| <a id="property-insightscreated"></a> `insightsCreated` | `readonly` | `number` | Insights synthesized by the deep-phase reflection pass (P1-1). | packages/memory/src/consolidator/types.ts:334 |
| <a id="property-learnedcontextupdated"></a> `learnedContextUpdated?` | `readonly` | `boolean` | True when the learned-context digest block was rewritten (D3). | packages/memory/src/consolidator/types.ts:336 |
| <a id="property-llmcostusd"></a> `llmCostUsd` | `readonly` | `number` \| `null` | - | packages/memory/src/consolidator/types.ts:340 |
| <a id="property-llmtokensused"></a> `llmTokensUsed` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:339 |
| <a id="property-noisefilteredcount"></a> `noiseFilteredCount` | `readonly` | `number` | - | packages/memory/src/consolidator/types.ts:337 |
| <a id="property-phase"></a> `phase` | `readonly` | [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md) | - | packages/memory/src/consolidator/types.ts:326 |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"deferred"` \| `"partial"` | - | packages/memory/src/consolidator/types.ts:327 |
