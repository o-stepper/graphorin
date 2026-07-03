[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RunOptions

# Interface: RunOptions\&lt;I, O\&gt;

Defined in: evals/src/types.ts:40

Options accepted by the parallel runner.

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agent"></a> `agent` | `readonly` | [`AgentLike`](/api/@graphorin/evals/interfaces/AgentLike.md)\&lt;`I`, `O`\&gt; | - | evals/src/types.ts:41 |
| <a id="property-concurrency"></a> `concurrency?` | `readonly` | `number` | Default `1` (sequential). Set higher for parallel evaluation. | evals/src/types.ts:54 |
| <a id="property-dataset"></a> `dataset` | `readonly` | \{ `cases`: readonly \{ `expected?`: `O`; `id?`: `string`; `input`: `I`; `metadata?`: `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>; \}[]; \} | - | evals/src/types.ts:42 |
| `dataset.cases` | `readonly` | readonly \{ `expected?`: `O`; `id?`: `string`; `input`: `I`; `metadata?`: `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>; \}[] | - | evals/src/types.ts:43 |
| <a id="property-iterations"></a> `iterations?` | `readonly` | `number` | Default `1`. | evals/src/types.ts:52 |
| <a id="property-onprogress"></a> `onProgress?` | `readonly` | (`event`) => `void` | Optional progress hook invoked after every case. Useful for terminal reporters that want a per-case heartbeat. | evals/src/types.ts:67 |
| <a id="property-scorers"></a> `scorers` | `readonly` | readonly [`Scorer`](/api/@graphorin/evals/interfaces/Scorer.md)\&lt;`I`, `O`\&gt;[] | - | evals/src/types.ts:50 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | evals/src/types.ts:55 |
| <a id="property-throwonabort"></a> `throwOnAbort?` | `readonly` | `boolean` | How to handle `signal` abort. Default (`false`): stop dispatching and resolve with a **partial** [EvalReport](/api/@graphorin/evals/interfaces/EvalReport.md) (`aborted: true`) covering the cases that finished — a long judged run shouldn't lose all completed work to a Ctrl+C. Set `true` to throw the abort reason instead. | evals/src/types.ts:62 |
