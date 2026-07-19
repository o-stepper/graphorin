[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / LlmRerankerOptions

# Interface: LlmRerankerOptions\&lt;TRecord\&gt;

Defined in: src/reranker.ts:30

**`Stable`**

Options accepted by [createLlmReranker](/api/@graphorin/reranker-llm/functions/createLlmReranker.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-batchsize"></a> `batchSize?` | `readonly` | `number` | Concurrent provider calls per batch. Default `5`. Larger values improve throughput at the cost of provider rate-limit pressure. | src/reranker.ts:42 |
| <a id="property-fallbackscore"></a> `fallbackScore?` | `readonly` | `number` | Default fallback score (in [0, 1]) used when the model's reply cannot be parsed as a non-negative integer. Default `0`. | src/reranker.ts:75 |
| <a id="property-maxoutputtokens"></a> `maxOutputTokens?` | `readonly` | `number` | Optional max-tokens hint for the integer-only output. Default `8` - large enough for multi-digit `maxScore` values, small enough to fail-fast if the model drifts into a verbose response. | src/reranker.ts:64 |
| <a id="property-maxscore"></a> `maxScore?` | `readonly` | `number` | Maximum integer the model is allowed to return. Default `10`. Score is normalised to `[0, 1]` by dividing by `maxScore`. | src/reranker.ts:37 |
| <a id="property-passageextractor"></a> `passageExtractor?` | `readonly` | [`PassageExtractor`](/api/@graphorin/reranker-llm/type-aliases/PassageExtractor.md)\&lt;`TRecord`\&gt; | Override the passage extractor - replaces the default heuristic that walks `text → summary → value → label → id`. | src/reranker.ts:53 |
| <a id="property-provider"></a> `provider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | Provider used to score each `(query, passage)` pair. | src/reranker.ts:32 |
| <a id="property-scoringprompt"></a> `scoringPrompt?` | `readonly` | [`ScoringPromptBuilder`](/api/@graphorin/reranker-llm/type-aliases/ScoringPromptBuilder.md) | Override the scoring prompt builder. Defaults to the English template (`defaultScoringPrompt`); pass a localised version per deployment. | src/reranker.ts:48 |
| <a id="property-sensitivityfloor"></a> `sensitivityFloor?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Optional `Sensitivity` floor passed through to the provider's sensitivity filter when present. Default `undefined` (provider decides). | src/reranker.ts:70 |
| <a id="property-temperature"></a> `temperature?` | `readonly` | `number` | Optional sampling temperature. Default `0`. Override only for deliberate stochasticity (e.g. exploring a topK > maxScore). | src/reranker.ts:58 |
