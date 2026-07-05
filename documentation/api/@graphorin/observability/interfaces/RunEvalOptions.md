[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / RunEvalOptions

# Interface: RunEvalOptions\&lt;I, O\&gt;

Defined in: packages/observability/src/eval/types.ts:116

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agent"></a> `agent` | `readonly` | \{ `run`: (`input`) => `Promise`\&lt;`O`\&gt;; \} | packages/observability/src/eval/types.ts:117 |
| `agent.run` | `readonly` | (`input`) => `Promise`\&lt;`O`\&gt; | packages/observability/src/eval/types.ts:117 |
| <a id="property-dataset"></a> `dataset` | `readonly` | [`Dataset`](/api/@graphorin/observability/interfaces/Dataset.md)\&lt;`I`, `O`\&gt; | packages/observability/src/eval/types.ts:118 |
| <a id="property-iterations"></a> `iterations?` | `readonly` | `number` | packages/observability/src/eval/types.ts:120 |
| <a id="property-scorers"></a> `scorers` | `readonly` | readonly [`Scorer`](/api/@graphorin/observability/interfaces/Scorer.md)\&lt;`I`, `O`\&gt;[] | packages/observability/src/eval/types.ts:119 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | packages/observability/src/eval/types.ts:121 |
