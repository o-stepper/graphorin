[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / RetrievalGradeOptions

# Interface: RetrievalGradeOptions

Defined in: packages/memory/src/search/iterative.ts:186

**`Stable`**

Per-call options for a [RetrievalGrader](/api/@graphorin/memory/interfaces/RetrievalGrader.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Cancellation signal forwarded to the underlying provider call. | packages/memory/src/search/iterative.ts:188 |
| <a id="property-triedqueries"></a> `triedQueries?` | `readonly` | readonly `string`[] | Reformulations already attempted. Surfaced to the grader as context so it can propose something genuinely new - the grade itself is ALWAYS judged against the original question, never a reformulation (a narrowed sub-query must not be declared "sufficient" while the original multi-hop question is not). | packages/memory/src/search/iterative.ts:196 |
