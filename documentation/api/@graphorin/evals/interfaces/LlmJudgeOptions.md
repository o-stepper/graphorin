[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / LlmJudgeOptions

# Interface: LlmJudgeOptions\&lt;I, O\&gt;

Defined in: evals/src/scorers/llm/judge.ts:16

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-buildprompt"></a> `buildPrompt?` | `readonly` | (`input`) => \{ `system`: `string`; `user`: `string`; \} | Override the scoring prompt. The default is English. | evals/src/scorers/llm/judge.ts:29 |
| <a id="property-maxoutputtokens"></a> `maxOutputTokens?` | `readonly` | `number` | Default `8`. | evals/src/scorers/llm/judge.ts:27 |
| <a id="property-maxscore"></a> `maxScore?` | `readonly` | `number` | Default `10`. | evals/src/scorers/llm/judge.ts:21 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional name override. Default `'llm-judge'`. | evals/src/scorers/llm/judge.ts:19 |
| <a id="property-passthreshold"></a> `passThreshold?` | `readonly` | `number` | Pass threshold (raw score). Default `Math.ceil(maxScore * 0.7)`. | evals/src/scorers/llm/judge.ts:23 |
| <a id="property-provider"></a> `provider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | - | evals/src/scorers/llm/judge.ts:17 |
| <a id="property-temperature"></a> `temperature?` | `readonly` | `number` | Default `0` for deterministic grading. | evals/src/scorers/llm/judge.ts:25 |
