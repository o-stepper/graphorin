[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RunEvalOptions

# Interface: RunEvalOptions\&lt;I, O\&gt;

Defined in: observability/dist/eval/types.d.ts:97

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agent"></a> `agent` | `readonly` | \{ `run`: (`input`) => `Promise`\&lt;`O`\&gt;; \} | observability/dist/eval/types.d.ts:98 |
| `agent.run` | `readonly` | (`input`) => `Promise`\&lt;`O`\&gt; | observability/dist/eval/types.d.ts:99 |
| <a id="property-dataset"></a> `dataset` | `readonly` | [`Dataset`](/api/@graphorin/evals/interfaces/Dataset.md)\&lt;`I`, `O`\&gt; | observability/dist/eval/types.d.ts:101 |
| <a id="property-iterations"></a> `iterations?` | `readonly` | `number` | observability/dist/eval/types.d.ts:103 |
| <a id="property-scorers"></a> `scorers` | `readonly` | readonly [`Scorer`](/api/@graphorin/evals/interfaces/Scorer.md)\&lt;`I`, `O`\&gt;[] | observability/dist/eval/types.d.ts:102 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | observability/dist/eval/types.d.ts:104 |
