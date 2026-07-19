[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RunEvalOptions

# Interface: RunEvalOptions\&lt;I, O\&gt;

Defined in: packages/observability/dist/eval/types.d.ts:115

**`Stable`**

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agent"></a> `agent` | `readonly` | \{ `run`: (`input`) => `Promise`\&lt;`O`\&gt;; \} | packages/observability/dist/eval/types.d.ts:116 |
| `agent.run` | `readonly` | (`input`) => `Promise`\&lt;`O`\&gt; | packages/observability/dist/eval/types.d.ts:117 |
| <a id="property-dataset"></a> `dataset` | `readonly` | [`Dataset`](/api/@graphorin/evals/interfaces/Dataset.md)\&lt;`I`, `O`\&gt; | packages/observability/dist/eval/types.d.ts:119 |
| <a id="property-iterations"></a> `iterations?` | `readonly` | `number` | packages/observability/dist/eval/types.d.ts:121 |
| <a id="property-scorers"></a> `scorers` | `readonly` | readonly [`Scorer`](/api/@graphorin/evals/interfaces/Scorer.md)\&lt;`I`, `O`\&gt;[] | packages/observability/dist/eval/types.d.ts:120 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | packages/observability/dist/eval/types.d.ts:122 |
