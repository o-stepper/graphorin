[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / RunEvalOptions

# Interface: RunEvalOptions\&lt;I, O\&gt;

Defined in: [packages/observability/dist/eval/types.d.ts:115](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L115)

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agent"></a> `agent` | `readonly` | \{ `run`: (`input`) => `Promise`\&lt;`O`\&gt;; \} | [packages/observability/dist/eval/types.d.ts:116](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L116) |
| `agent.run` | `readonly` | (`input`) => `Promise`\&lt;`O`\&gt; | [packages/observability/dist/eval/types.d.ts:117](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L117) |
| <a id="property-dataset"></a> `dataset` | `readonly` | [`Dataset`](/api/@graphorin/evals/interfaces/Dataset.md)\&lt;`I`, `O`\&gt; | [packages/observability/dist/eval/types.d.ts:119](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L119) |
| <a id="property-iterations"></a> `iterations?` | `readonly` | `number` | [packages/observability/dist/eval/types.d.ts:121](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L121) |
| <a id="property-scorers"></a> `scorers` | `readonly` | readonly [`Scorer`](/api/@graphorin/evals/interfaces/Scorer.md)\&lt;`I`, `O`\&gt;[] | [packages/observability/dist/eval/types.d.ts:120](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L120) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | [packages/observability/dist/eval/types.d.ts:122](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/eval/types.d.ts#L122) |
