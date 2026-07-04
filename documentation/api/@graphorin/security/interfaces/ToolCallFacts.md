[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ToolCallFacts

# Interface: ToolCallFacts

Defined in: packages/security/src/policy/tool-argument-policy.ts:33

Facts about a tool call the policy engine decides over.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args?` | `readonly` | `unknown` | The validated arguments (post-schema, post-repair). | packages/security/src/policy/tool-argument-policy.ts:39 |
| <a id="property-sensitive"></a> `sensitive?` | `readonly` | `boolean` | `true` when the tool reads/handles sensitive data (e.g. `sensitivity: 'secret'`). | packages/security/src/policy/tool-argument-policy.ts:37 |
| <a id="property-sideeffectclass"></a> `sideEffectClass` | `readonly` | [`PolicySideEffectClass`](/api/@graphorin/security/type-aliases/PolicySideEffectClass.md) | - | packages/security/src/policy/tool-argument-policy.ts:35 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | packages/security/src/policy/tool-argument-policy.ts:34 |
