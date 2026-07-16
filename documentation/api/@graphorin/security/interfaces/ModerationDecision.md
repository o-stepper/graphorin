[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ModerationDecision

# Interface: ModerationDecision

Defined in: [packages/security/src/guardrails/builtins/llm-moderation.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/llm-moderation.ts#L32)

Decision returned by a moderation provider. Designed to mirror the
common shape exposed by mainstream moderation endpoints.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-categories"></a> `categories?` | `readonly` | readonly `string`[] | [packages/security/src/guardrails/builtins/llm-moderation.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/llm-moderation.ts#L34) |
| <a id="property-flagged"></a> `flagged` | `readonly` | `boolean` | [packages/security/src/guardrails/builtins/llm-moderation.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/llm-moderation.ts#L33) |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | [packages/security/src/guardrails/builtins/llm-moderation.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/llm-moderation.ts#L36) |
| <a id="property-score"></a> `score?` | `readonly` | `number` | [packages/security/src/guardrails/builtins/llm-moderation.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/llm-moderation.ts#L35) |
