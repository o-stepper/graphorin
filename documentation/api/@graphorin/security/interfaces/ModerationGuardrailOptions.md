[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ModerationGuardrailOptions

# Interface: ModerationGuardrailOptions

Defined in: [packages/security/src/guardrails/builtins/llm-moderation.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/llm-moderation.ts#L56)

Options for `llmModeration(...)` (input) and `outputModeration(...)`
(output).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action?` | `readonly` | `"block"` \| `"warn"` | Action to take on a flagged decision. Defaults to `'block'`. | [packages/security/src/guardrails/builtins/llm-moderation.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/llm-moderation.ts#L61) |
| <a id="property-blockcategories"></a> `blockCategories?` | `readonly` | readonly `string`[] | Categories that always trigger a block, even if the score is below threshold. | [packages/security/src/guardrails/builtins/llm-moderation.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/llm-moderation.ts#L65) |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Override the guardrail name. | [packages/security/src/guardrails/builtins/llm-moderation.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/llm-moderation.ts#L63) |
| <a id="property-provider"></a> `provider` | `readonly` | [`ModerationProvider`](/api/@graphorin/security/type-aliases/ModerationProvider.md) | - | [packages/security/src/guardrails/builtins/llm-moderation.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/llm-moderation.ts#L57) |
| <a id="property-threshold"></a> `threshold?` | `readonly` | `number` | Confidence threshold; values above the threshold are flagged. | [packages/security/src/guardrails/builtins/llm-moderation.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/llm-moderation.ts#L59) |
