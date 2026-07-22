[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / RunEvalOptions

# Interface: RunEvalOptions\&lt;I, O\&gt;

Defined in: packages/observability/src/eval/types.ts:123

**`Stable`**

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agent"></a> `agent` | `readonly` | \{ `run`: (`input`) => `Promise`\&lt;`O`\&gt;; \} | packages/observability/src/eval/types.ts:124 |
| `agent.run` | `readonly` | (`input`) => `Promise`\&lt;`O`\&gt; | packages/observability/src/eval/types.ts:124 |
| <a id="property-dataset"></a> `dataset` | `readonly` | [`Dataset`](/api/@graphorin/observability/interfaces/Dataset.md)\&lt;`I`, `O`\&gt; | packages/observability/src/eval/types.ts:125 |
| <a id="property-iterations"></a> `iterations?` | `readonly` | `number` | packages/observability/src/eval/types.ts:127 |
| <a id="property-scorers"></a> `scorers` | `readonly` | readonly [`Scorer`](/api/@graphorin/observability/interfaces/Scorer.md)\&lt;`I`, `O`\&gt;[] | packages/observability/src/eval/types.ts:126 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | packages/observability/src/eval/types.ts:128 |
