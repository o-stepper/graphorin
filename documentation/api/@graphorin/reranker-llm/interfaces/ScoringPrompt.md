[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / ScoringPrompt

# Interface: ScoringPrompt

Defined in: scoring-prompt.ts:29

Result of a [ScoringPromptBuilder](/api/@graphorin/reranker-llm/type-aliases/ScoringPromptBuilder.md) call. The system message is
forwarded verbatim to the provider; the user message is the
per-pair instruction.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-system"></a> `system` | `readonly` | `string` | scoring-prompt.ts:30 |
| <a id="property-user"></a> `user` | `readonly` | `string` | scoring-prompt.ts:31 |
