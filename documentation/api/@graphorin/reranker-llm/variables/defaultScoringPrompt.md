[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / defaultScoringPrompt

# Variable: defaultScoringPrompt

```ts
const defaultScoringPrompt: ScoringPromptBuilder;
```

Defined in: src/scoring-prompt.ts:69

Default English scoring prompt. Asks the model to emit a single integer in
`[0, maxScore]` and to omit any other text. The passage is wrapped in
explicit delimiters and framed as untrusted DATA - never instructions - so a
poisoned memory can't steer its own relevance score (PS-14).

## Stable
