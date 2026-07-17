[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / DifficultyAssessment

# Interface: DifficultyAssessment

Defined in: [packages/memory/src/search/iterative.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/iterative.ts#L68)

Outcome of the heuristic difficulty gate. `hard` is the gating
decision (`score >= threshold`); `signals` lists which heuristic
categories fired, for explainability / tracing.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-hard"></a> `hard` | `readonly` | `boolean` | - | [packages/memory/src/search/iterative.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/iterative.ts#L69) |
| <a id="property-score"></a> `score` | `readonly` | `number` | Aggregate difficulty score, clamped to `[0, 1]`. | [packages/memory/src/search/iterative.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/iterative.ts#L71) |
| <a id="property-signals"></a> `signals` | `readonly` | readonly `string`[] | Heuristic categories that fired (`'multi-hop'`, `'temporal'`, …). | [packages/memory/src/search/iterative.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/iterative.ts#L73) |
