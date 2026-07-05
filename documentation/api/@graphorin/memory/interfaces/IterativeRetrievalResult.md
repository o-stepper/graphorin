[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / IterativeRetrievalResult

# Interface: IterativeRetrievalResult\&lt;H\&gt;

Defined in: packages/memory/src/search/iterative.ts:341

Result of an iterative retrieval run.

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `H` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-abstained"></a> `abstained` | `readonly` | `boolean` | `true` when the loop exhausted its cap / ran out of reformulations while still judged insufficient - the caller should abstain rather than answer from `hits`. | packages/memory/src/search/iterative.ts:355 |
| <a id="property-gatehard"></a> `gateHard` | `readonly` | `boolean` | Difficulty-gate verdict (whether the loop was eligible to run). | packages/memory/src/search/iterative.ts:347 |
| <a id="property-graded"></a> `graded` | `readonly` | `boolean` | `true` when the grader actually judged the result at least once (memory-retrieval-02). `false` on the single-shot path (gate not hard, or no grader configured) - there `sufficient: true` is a DEFAULT, not a verdict, and consumers must not read it as one. | packages/memory/src/search/iterative.ts:362 |
| <a id="property-hits"></a> `hits` | `readonly` | readonly `H`[] | Accumulated hits across all passes (deduped, in discovery order). | packages/memory/src/search/iterative.ts:343 |
| <a id="property-iterations"></a> `iterations` | `readonly` | `number` | Number of retrieval passes performed (≥ 1). | packages/memory/src/search/iterative.ts:345 |
| <a id="property-queries"></a> `queries` | `readonly` | readonly `string`[] | The sequence of queries tried (original first). | packages/memory/src/search/iterative.ts:364 |
| <a id="property-sufficient"></a> `sufficient` | `readonly` | `boolean` | Final sufficiency verdict. | packages/memory/src/search/iterative.ts:349 |
