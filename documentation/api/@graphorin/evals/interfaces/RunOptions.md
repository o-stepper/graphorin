[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RunOptions

# Interface: RunOptions\&lt;I, O\&gt;

Defined in: packages/evals/src/types.ts:40

**`Stable`**

Options accepted by the parallel runner.

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agent"></a> `agent?` | `readonly` | [`AgentLike`](/api/@graphorin/evals/interfaces/AgentLike.md)\&lt;`I`, `O`\&gt; | Single agent shared by every worker. Safe only when the object tolerates overlapping `run()` calls (stubs, stateless wrappers) or `concurrency` is `1`: a Graphorin `Agent` instance allows one run in flight and throws `ConcurrentRunError` on overlap, which the runner surfaces as an `EvalConcurrencyError` instead of recording per-case scorer failures. For a framework agent at `concurrency > 1`, pass [agentFactory](/api/@graphorin/evals/interfaces/RunOptions.md#property-agentfactory) instead. | packages/evals/src/types.ts:50 |
| <a id="property-agentfactory"></a> `agentFactory?` | `readonly` | (`workerIndex`) => \| [`AgentLike`](/api/@graphorin/evals/interfaces/AgentLike.md)\&lt;`I`, `O`\&gt; \| `Promise`\<[`AgentLike`](/api/@graphorin/evals/interfaces/AgentLike.md)\&lt;`I`, `O`\&gt;\> | Per-worker agent constructor - invoked once per worker (at most `min(concurrency, total cases)` times, with the worker index) before that worker takes its first case, so every worker drives its own instance. This is the supported way to run a Graphorin `Agent` at `concurrency > 1` (one run in flight per instance). Takes precedence over [agent](/api/@graphorin/evals/interfaces/RunOptions.md#property-agent) when both are set; at least one of the two is required. | packages/evals/src/types.ts:60 |
| <a id="property-concurrency"></a> `concurrency?` | `readonly` | `number` | Default `1` (sequential). Set higher for parallel evaluation. | packages/evals/src/types.ts:73 |
| <a id="property-dataset"></a> `dataset` | `readonly` | \{ `cases`: readonly \{ `expected?`: `O`; `id?`: `string`; `input`: `I`; `metadata?`: `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>; \}[]; \} | - | packages/evals/src/types.ts:61 |
| `dataset.cases` | `readonly` | readonly \{ `expected?`: `O`; `id?`: `string`; `input`: `I`; `metadata?`: `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>; \}[] | - | packages/evals/src/types.ts:62 |
| <a id="property-iterations"></a> `iterations?` | `readonly` | `number` | Default `1`. | packages/evals/src/types.ts:71 |
| <a id="property-onprogress"></a> `onProgress?` | `readonly` | (`event`) => `void` | Optional progress hook invoked after every case. Useful for terminal reporters that want a per-case heartbeat. | packages/evals/src/types.ts:86 |
| <a id="property-scorers"></a> `scorers` | `readonly` | readonly [`Scorer`](/api/@graphorin/evals/interfaces/Scorer.md)\&lt;`I`, `O`\&gt;[] | - | packages/evals/src/types.ts:69 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/evals/src/types.ts:74 |
| <a id="property-throwonabort"></a> `throwOnAbort?` | `readonly` | `boolean` | How to handle `signal` abort. Default (`false`): stop dispatching and resolve with a **partial** [EvalReport](/api/@graphorin/evals/interfaces/EvalReport.md) (`aborted: true`) covering the cases that finished - a long judged run shouldn't lose all completed work to a Ctrl+C. Set `true` to throw the abort reason instead. | packages/evals/src/types.ts:81 |
