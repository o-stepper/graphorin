[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PhaseOutcome

# Interface: PhaseOutcome

Defined in: [packages/memory/src/consolidator/types.ts:325](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L325)

Outcome surfaced by every phase invocation. Recorded into
`consolidator_runs` and emitted on the AISpan.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictsresolved"></a> `conflictsResolved` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:330](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L330) |
| <a id="property-emptyextractions"></a> `emptyExtractions` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:338](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L338) |
| <a id="property-episodesformed"></a> `episodesFormed` | `readonly` | `number` | Episodes auto-formed from the processed slice (P1-2). | [packages/memory/src/consolidator/types.ts:332](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L332) |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` \| `null` | - | [packages/memory/src/consolidator/types.ts:341](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L341) |
| <a id="property-factscreated"></a> `factsCreated` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:328](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L328) |
| <a id="property-factsupdated"></a> `factsUpdated` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:329](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L329) |
| <a id="property-insightscreated"></a> `insightsCreated` | `readonly` | `number` | Insights synthesized by the deep-phase reflection pass (P1-1). | [packages/memory/src/consolidator/types.ts:334](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L334) |
| <a id="property-learnedcontextupdated"></a> `learnedContextUpdated?` | `readonly` | `boolean` | True when the learned-context digest block was rewritten (D3). | [packages/memory/src/consolidator/types.ts:336](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L336) |
| <a id="property-llmcostusd"></a> `llmCostUsd` | `readonly` | `number` \| `null` | - | [packages/memory/src/consolidator/types.ts:340](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L340) |
| <a id="property-llmtokensused"></a> `llmTokensUsed` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:339](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L339) |
| <a id="property-noisefilteredcount"></a> `noiseFilteredCount` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:337](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L337) |
| <a id="property-phase"></a> `phase` | `readonly` | [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md) | - | [packages/memory/src/consolidator/types.ts:326](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L326) |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"deferred"` \| `"partial"` | - | [packages/memory/src/consolidator/types.ts:327](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L327) |
