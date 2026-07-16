[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / MaxLengthOptions

# Interface: MaxLengthOptions

Defined in: [packages/security/src/guardrails/builtins/max-length.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/max-length.ts#L26)

Options for `maxLength(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action?` | `readonly` | `"block"` \| `"warn"` | Override the action (defaults to `'block'`). | [packages/security/src/guardrails/builtins/max-length.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/max-length.ts#L34) |
| <a id="property-chars"></a> `chars?` | `readonly` | `number` | Hard ceiling on `value.length` (string char count). | [packages/security/src/guardrails/builtins/max-length.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/max-length.ts#L28) |
| <a id="property-counttokens"></a> `countTokens?` | `readonly` | (`text`) => `number` \| `Promise`\&lt;`number`\&gt; | Token-counter callback used when `tokens` is set. | [packages/security/src/guardrails/builtins/max-length.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/max-length.ts#L32) |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Override the guardrail's `name` (useful when registering more than one). | [packages/security/src/guardrails/builtins/max-length.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/max-length.ts#L38) |
| <a id="property-stage"></a> `stage?` | `readonly` | `"input"` \| `"output"` | Stage the guardrail applies to. Defaults to `'input'`. | [packages/security/src/guardrails/builtins/max-length.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/max-length.ts#L36) |
| <a id="property-tokens"></a> `tokens?` | `readonly` | `number` | Hard ceiling on the token count returned by `countTokens(...)`. | [packages/security/src/guardrails/builtins/max-length.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/max-length.ts#L30) |
