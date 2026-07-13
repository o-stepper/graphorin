[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ToolCallFacts

# Interface: ToolCallFacts

Defined in: [packages/security/src/policy/tool-argument-policy.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L36)

Facts about a tool call the policy engine decides over.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args?` | `readonly` | `unknown` | The validated arguments (post-schema, post-repair). | [packages/security/src/policy/tool-argument-policy.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L51) |
| <a id="property-sensitive"></a> `sensitive?` | `readonly` | `boolean` | `true` when the tool reads/handles sensitive data (e.g. `sensitivity: 'secret'`). | [packages/security/src/policy/tool-argument-policy.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L40) |
| <a id="property-sideeffectclass"></a> `sideEffectClass` | `readonly` | [`PolicySideEffectClass`](/api/@graphorin/security/type-aliases/PolicySideEffectClass.md) | - | [packages/security/src/policy/tool-argument-policy.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L38) |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | [packages/security/src/policy/tool-argument-policy.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L37) |
| <a id="property-untrustedsource"></a> `untrustedSource?` | `readonly` | `boolean` | `true` when the tool is an untrusted-content SOURCE (W-101) - its trust class is one the taint engine treats as injection-bearing (mcp-derived / web-search / skill-untrusted; see `isUntrustedTrustClass` in `@graphorin/security/dataflow`). Powers the Rule-of-Two `untrustedInput` leg. The engine stays pure: the caller derives this from the tool's metadata. | [packages/security/src/policy/tool-argument-policy.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L49) |
