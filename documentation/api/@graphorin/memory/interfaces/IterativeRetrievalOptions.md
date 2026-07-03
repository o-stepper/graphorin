[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / IterativeRetrievalOptions

# Interface: IterativeRetrievalOptions

Defined in: packages/memory/src/search/iterative.ts:394

Options for [runIterativeRetrieval](/api/@graphorin/memory/functions/runIterativeRetrieval.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-difficulty"></a> `difficulty?` | `readonly` | [`DifficultyGateOptions`](/api/@graphorin/memory/interfaces/DifficultyGateOptions.md) | Difficulty-gate tuning. | packages/memory/src/search/iterative.ts:398 |
| <a id="property-forcehard"></a> `forceHard?` | `readonly` | `boolean` | Skip the heuristic gate and force the loop (still capped). | packages/memory/src/search/iterative.ts:400 |
| <a id="property-maxgradesnippets"></a> `maxGradeSnippets?` | `readonly` | `number` | Max snippets passed to the grader per pass. Default 8. | packages/memory/src/search/iterative.ts:402 |
| <a id="property-maxiterations"></a> `maxIterations?` | `readonly` | `number` | Total-pass cap; clamped to `[1, {@link MAX_ITERATIONS_CEILING}]`. | packages/memory/src/search/iterative.ts:396 |
| <a id="property-maxresults"></a> `maxResults?` | `readonly` | `number` | Cap on the returned hit count (omitted ⇒ all accumulated). | packages/memory/src/search/iterative.ts:404 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/memory/src/search/iterative.ts:405 |
