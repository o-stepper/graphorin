[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ObservedToolCall

# Interface: ObservedToolCall

Defined in: packages/security/src/guardrails/builtins/tool-usage-validator.ts:24

**`Stable`**

Shape of one observed tool call. Aligned with `ToolCall` from
`@graphorin/core` but decoupled - the validator reads only what it
needs so deployments can repurpose it for other shapes.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args?` | `readonly` | `unknown` | packages/security/src/guardrails/builtins/tool-usage-validator.ts:27 |
| <a id="property-toolcallid"></a> `toolCallId?` | `readonly` | `string` | packages/security/src/guardrails/builtins/tool-usage-validator.ts:26 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | packages/security/src/guardrails/builtins/tool-usage-validator.ts:25 |
