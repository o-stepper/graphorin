[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PhaseOutcome

# Interface: PhaseOutcome

Defined in: packages/memory/src/consolidator/types.ts:188

Outcome surfaced by every phase invocation. Recorded into
`consolidator_runs` and emitted on the AISpan.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-conflictsresolved"></a> `conflictsResolved` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:193 |
| <a id="property-emptyextractions"></a> `emptyExtractions` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:195 |
| <a id="property-errormessage"></a> `errorMessage` | `readonly` | `string` \| `null` | packages/memory/src/consolidator/types.ts:198 |
| <a id="property-factscreated"></a> `factsCreated` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:191 |
| <a id="property-factsupdated"></a> `factsUpdated` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:192 |
| <a id="property-llmcostusd"></a> `llmCostUsd` | `readonly` | `number` \| `null` | packages/memory/src/consolidator/types.ts:197 |
| <a id="property-llmtokensused"></a> `llmTokensUsed` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:196 |
| <a id="property-noisefilteredcount"></a> `noiseFilteredCount` | `readonly` | `number` | packages/memory/src/consolidator/types.ts:194 |
| <a id="property-phase"></a> `phase` | `readonly` | [`ConsolidatorPhase`](/api/@graphorin/memory/type-aliases/ConsolidatorPhase.md) | packages/memory/src/consolidator/types.ts:189 |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"deferred"` \| `"partial"` | packages/memory/src/consolidator/types.ts:190 |
