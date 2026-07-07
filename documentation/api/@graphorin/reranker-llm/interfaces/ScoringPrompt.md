[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / ScoringPrompt

# Interface: ScoringPrompt

Defined in: [packages/reranker-llm/src/scoring-prompt.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/scoring-prompt.ts#L29)

Result of a [ScoringPromptBuilder](/api/@graphorin/reranker-llm/type-aliases/ScoringPromptBuilder.md) call. The system message is
forwarded verbatim to the provider; the user message is the
per-pair instruction.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-system"></a> `system` | `readonly` | `string` | [packages/reranker-llm/src/scoring-prompt.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/scoring-prompt.ts#L30) |
| <a id="property-user"></a> `user` | `readonly` | `string` | [packages/reranker-llm/src/scoring-prompt.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-llm/src/scoring-prompt.ts#L31) |
