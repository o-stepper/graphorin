[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / ScoringPrompt

# Interface: ScoringPrompt

Defined in: src/scoring-prompt.ts:29

**`Stable`**

Result of a [ScoringPromptBuilder](/api/@graphorin/reranker-llm/type-aliases/ScoringPromptBuilder.md) call. The system message is
forwarded verbatim to the provider; the user message is the
per-pair instruction.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-system"></a> `system` | `readonly` | `string` | src/scoring-prompt.ts:30 |
| <a id="property-user"></a> `user` | `readonly` | `string` | src/scoring-prompt.ts:31 |
