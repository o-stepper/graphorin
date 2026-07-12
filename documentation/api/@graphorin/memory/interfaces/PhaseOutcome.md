[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PhaseOutcome

# Interface: PhaseOutcome

Defined in: [packages/memory/src/consolidator/types.ts:361](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L361)

Outcome surfaced by every phase invocation. Recorded into
`consolidator_runs` and emitted on the AISpan.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictsresolved"></a> `conflictsResolved` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:366](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L366) |
| <a id="property-emptyextractions"></a> `emptyExtractions` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:374](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L374) |
| <a id="property-episodesformed"></a> `episodesFormed` | `readonly` | `number` | Episodes auto-formed from the processed slice (P1-2). | [packages/memory/src/consolidator/types.ts:368](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L368) |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` \| `null` | - | [packages/memory/src/consolidator/types.ts:377](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L377) |
| <a id="property-factscreated"></a> `factsCreated` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:364](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L364) |
| <a id="property-factsupdated"></a> `factsUpdated` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:365](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L365) |
| <a id="property-insightscreated"></a> `insightsCreated` | `readonly` | `number` | Insights synthesized by the deep-phase reflection pass (P1-1). | [packages/memory/src/consolidator/types.ts:370](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L370) |
| <a id="property-learnedcontextupdated"></a> `learnedContextUpdated?` | `readonly` | `boolean` | True when the learned-context digest block was rewritten (D3). | [packages/memory/src/consolidator/types.ts:372](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L372) |
| <a id="property-llmcostusd"></a> `llmCostUsd` | `readonly` | `number` \| `null` | - | [packages/memory/src/consolidator/types.ts:376](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L376) |
| <a id="property-llmtokensused"></a> `llmTokensUsed` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:375](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L375) |
| <a id="property-noisefilteredcount"></a> `noiseFilteredCount` | `readonly` | `number` | - | [packages/memory/src/consolidator/types.ts:373](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L373) |
| <a id="property-phase"></a> `phase` | `readonly` | [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md) | - | [packages/memory/src/consolidator/types.ts:362](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L362) |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"deferred"` \| `"partial"` | - | [packages/memory/src/consolidator/types.ts:363](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/types.ts#L363) |
