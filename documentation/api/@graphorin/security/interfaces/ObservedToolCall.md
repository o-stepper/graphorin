[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ObservedToolCall

# Interface: ObservedToolCall

Defined in: [packages/security/src/guardrails/builtins/tool-usage-validator.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/tool-usage-validator.ts#L24)

Shape of one observed tool call. Aligned with `ToolCall` from
`@graphorin/core` but decoupled - the validator reads only what it
needs so deployments can repurpose it for other shapes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args?` | `readonly` | `unknown` | [packages/security/src/guardrails/builtins/tool-usage-validator.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/tool-usage-validator.ts#L27) |
| <a id="property-toolcallid"></a> `toolCallId?` | `readonly` | `string` | [packages/security/src/guardrails/builtins/tool-usage-validator.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/tool-usage-validator.ts#L26) |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | [packages/security/src/guardrails/builtins/tool-usage-validator.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/tool-usage-validator.ts#L25) |
