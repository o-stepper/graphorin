[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / StageContext

# Interface: StageContext

Defined in: [packages/memory/src/conflict/types.ts:125](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L125)

Inputs the orchestrator hands every stage. The `existing` array is
populated during Stage 2 (vector search top-K); Stage 1 receives an
empty array because the dedup hash is computed off the candidate
alone.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-candidate"></a> `candidate` | `readonly` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) | [packages/memory/src/conflict/types.ts:126](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L126) |
| <a id="property-existing"></a> `existing` | `readonly` | readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`Fact`](/api/@graphorin/core/interfaces/Fact.md)\&gt;[] | [packages/memory/src/conflict/types.ts:127](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L127) |
| <a id="property-localepack"></a> `localePack` | `readonly` | [`LocalePack`](/api/@graphorin/memory/interfaces/LocalePack.md) | [packages/memory/src/conflict/types.ts:128](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L128) |
| <a id="property-thresholds"></a> `thresholds` | `readonly` | [`ConflictThresholds`](/api/@graphorin/memory/interfaces/ConflictThresholds.md) | [packages/memory/src/conflict/types.ts:129](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L129) |
