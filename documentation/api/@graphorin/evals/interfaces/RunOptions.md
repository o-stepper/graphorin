[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RunOptions

# Interface: RunOptions\&lt;I, O\&gt;

Defined in: [packages/evals/src/types.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L40)

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
| <a id="property-agent"></a> `agent` | `readonly` | [`AgentLike`](/api/@graphorin/evals/interfaces/AgentLike.md)\&lt;`I`, `O`\&gt; | - | [packages/evals/src/types.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L41) |
| <a id="property-concurrency"></a> `concurrency?` | `readonly` | `number` | Default `1` (sequential). Set higher for parallel evaluation. | [packages/evals/src/types.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L54) |
| <a id="property-dataset"></a> `dataset` | `readonly` | \{ `cases`: readonly \{ `expected?`: `O`; `id?`: `string`; `input`: `I`; `metadata?`: `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>; \}[]; \} | - | [packages/evals/src/types.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L42) |
| `dataset.cases` | `readonly` | readonly \{ `expected?`: `O`; `id?`: `string`; `input`: `I`; `metadata?`: `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>; \}[] | - | [packages/evals/src/types.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L43) |
| <a id="property-iterations"></a> `iterations?` | `readonly` | `number` | Default `1`. | [packages/evals/src/types.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L52) |
| <a id="property-onprogress"></a> `onProgress?` | `readonly` | (`event`) => `void` | Optional progress hook invoked after every case. Useful for terminal reporters that want a per-case heartbeat. | [packages/evals/src/types.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L67) |
| <a id="property-scorers"></a> `scorers` | `readonly` | readonly [`Scorer`](/api/@graphorin/evals/interfaces/Scorer.md)\&lt;`I`, `O`\&gt;[] | - | [packages/evals/src/types.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L50) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | [packages/evals/src/types.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L55) |
| <a id="property-throwonabort"></a> `throwOnAbort?` | `readonly` | `boolean` | How to handle `signal` abort. Default (`false`): stop dispatching and resolve with a **partial** [EvalReport](/api/@graphorin/evals/interfaces/EvalReport.md) (`aborted: true`) covering the cases that finished - a long judged run shouldn't lose all completed work to a Ctrl+C. Set `true` to throw the abort reason instead. | [packages/evals/src/types.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L62) |
