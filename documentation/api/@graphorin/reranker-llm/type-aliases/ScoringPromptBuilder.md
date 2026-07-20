[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / ScoringPromptBuilder

# Type Alias: ScoringPromptBuilder

```ts
type ScoringPromptBuilder = (input) => ScoringPrompt;
```

Defined in: src/scoring-prompt.ts:39

**`Stable`**

Function shape consumed by [createLlmReranker](/api/@graphorin/reranker-llm/functions/createLlmReranker.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`ScoringPromptInput`](/api/@graphorin/reranker-llm/interfaces/ScoringPromptInput.md) |

## Returns

[`ScoringPrompt`](/api/@graphorin/reranker-llm/interfaces/ScoringPrompt.md)
