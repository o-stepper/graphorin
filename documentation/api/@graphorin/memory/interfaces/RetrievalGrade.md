[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / RetrievalGrade

# Interface: RetrievalGrade

Defined in: [packages/memory/src/search/iterative.ts:167](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/iterative.ts#L167)

Verdict from grading a retrieved candidate set against a query.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-confidence"></a> `confidence` | `readonly` | `number` | Grader confidence, clamped to `[0, 1]`. | [packages/memory/src/search/iterative.ts:171](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/iterative.ts#L171) |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | Optional short rationale (never surfaced in spans). | [packages/memory/src/search/iterative.ts:178](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/iterative.ts#L178) |
| <a id="property-reformulation"></a> `reformulation` | `readonly` | `string` \| `null` | A single better search query to try next, or `null` when the grader proposes none (the loop then stops / abstains). | [packages/memory/src/search/iterative.ts:176](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/iterative.ts#L176) |
| <a id="property-sufficient"></a> `sufficient` | `readonly` | `boolean` | Whether the retrieved memories suffice to answer the query. | [packages/memory/src/search/iterative.ts:169](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/iterative.ts#L169) |
