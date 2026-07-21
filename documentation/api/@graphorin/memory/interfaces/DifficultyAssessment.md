[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / DifficultyAssessment

# Interface: DifficultyAssessment

Defined in: packages/memory/src/search/iterative.ts:68

**`Stable`**

Outcome of the heuristic difficulty gate. `hard` is the gating
decision (`score >= threshold`); `signals` lists which heuristic
categories fired, for explainability / tracing.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-hard"></a> `hard` | `readonly` | `boolean` | - | packages/memory/src/search/iterative.ts:69 |
| <a id="property-score"></a> `score` | `readonly` | `number` | Aggregate difficulty score, clamped to `[0, 1]`. | packages/memory/src/search/iterative.ts:71 |
| <a id="property-signals"></a> `signals` | `readonly` | readonly `string`[] | Heuristic categories that fired (`'multi-hop'`, `'temporal'`, …). | packages/memory/src/search/iterative.ts:73 |
