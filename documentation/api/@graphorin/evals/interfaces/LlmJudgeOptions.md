[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / LlmJudgeOptions

# Interface: LlmJudgeOptions\&lt;I, O\&gt;

Defined in: packages/evals/src/scorers/llm/judge.ts:71

**`Stable`**

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-buildprompt"></a> `buildPrompt?` | `readonly` | (`input`) => \{ `system`: `string`; `user`: `string`; \} | Override the scoring prompt. The default is English. | packages/evals/src/scorers/llm/judge.ts:93 |
| <a id="property-maxoutputtokens"></a> `maxOutputTokens?` | `readonly` | `number` | Default `16` (headroom for the `SCORE: <n>` line). | packages/evals/src/scorers/llm/judge.ts:82 |
| <a id="property-maxscore"></a> `maxScore?` | `readonly` | `number` | Default `10`. | packages/evals/src/scorers/llm/judge.ts:76 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Optional name override. Default `'llm-judge'`. | packages/evals/src/scorers/llm/judge.ts:74 |
| <a id="property-offformatretries"></a> `offFormatRetries?` | `readonly` | `number` | How many constrained re-asks a missing `SCORE: <n>` marker earns before the scorer throws [JudgeOffFormatError](/api/@graphorin/evals/classes/JudgeOffFormatError.md). Default `1`. The retry re-sends the conversation with an explicit marker-only instruction and a raised output budget (reasoning models can burn a tight `maxOutputTokens` on hidden reasoning and return an empty visible reply). `0` restores single-shot fail-loud. | packages/evals/src/scorers/llm/judge.ts:91 |
| <a id="property-passthreshold"></a> `passThreshold?` | `readonly` | `number` | Pass threshold (raw score). Default `Math.ceil(maxScore * 0.7)`. | packages/evals/src/scorers/llm/judge.ts:78 |
| <a id="property-provider"></a> `provider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | - | packages/evals/src/scorers/llm/judge.ts:72 |
| <a id="property-temperature"></a> `temperature?` | `readonly` | `number` | Default `0` for deterministic grading. | packages/evals/src/scorers/llm/judge.ts:80 |
