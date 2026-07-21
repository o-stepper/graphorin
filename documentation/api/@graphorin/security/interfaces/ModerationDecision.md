[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ModerationDecision

# Interface: ModerationDecision

Defined in: packages/security/src/guardrails/builtins/llm-moderation.ts:32

**`Stable`**

Decision returned by a moderation provider. Designed to mirror the
common shape exposed by mainstream moderation endpoints.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-categories"></a> `categories?` | `readonly` | readonly `string`[] | packages/security/src/guardrails/builtins/llm-moderation.ts:34 |
| <a id="property-flagged"></a> `flagged` | `readonly` | `boolean` | packages/security/src/guardrails/builtins/llm-moderation.ts:33 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | packages/security/src/guardrails/builtins/llm-moderation.ts:36 |
| <a id="property-score"></a> `score?` | `readonly` | `number` | packages/security/src/guardrails/builtins/llm-moderation.ts:35 |
