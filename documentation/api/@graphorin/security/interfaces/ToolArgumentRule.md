[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ToolArgumentRule

# Interface: ToolArgumentRule

Defined in: [packages/security/src/policy/tool-argument-policy.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L82)

A single Progent rule. `deny`/`forbid` always beats `allow` (see module doc).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-effect"></a> `effect` | `readonly` | [`ToolRuleEffect`](/api/@graphorin/security/type-aliases/ToolRuleEffect.md) | - | [packages/security/src/policy/tool-argument-policy.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L83) |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | Human-readable reason surfaced on a non-`allow` match. | [packages/security/src/policy/tool-argument-policy.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L92) |
| <a id="property-tool"></a> `tool` | `readonly` | `string` | Tool-name matcher: an exact name, `'*'` for any, or a trailing-`*` prefix glob (e.g. `'fs_*'`). Matching is case-sensitive. | [packages/security/src/policy/tool-argument-policy.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L88) |
| <a id="property-when"></a> `when?` | `readonly` | (`facts`) => `boolean` | Optional pure predicate over the call facts (args, sensitivity). | [packages/security/src/policy/tool-argument-policy.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L90) |
