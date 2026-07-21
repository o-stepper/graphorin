[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ToolArgumentRule

# Interface: ToolArgumentRule

Defined in: packages/security/src/policy/tool-argument-policy.ts:82

A single Progent rule. `deny`/`forbid` always beats `allow` (see module doc).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-effect"></a> `effect` | `readonly` | [`ToolRuleEffect`](/api/@graphorin/security/type-aliases/ToolRuleEffect.md) | - | packages/security/src/policy/tool-argument-policy.ts:83 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | Human-readable reason surfaced on a non-`allow` match. | packages/security/src/policy/tool-argument-policy.ts:92 |
| <a id="property-tool"></a> `tool` | `readonly` | `string` | Tool-name matcher: an exact name, `'*'` for any, or a trailing-`*` prefix glob (e.g. `'fs_*'`). Matching is case-sensitive. | packages/security/src/policy/tool-argument-policy.ts:88 |
| <a id="property-when"></a> `when?` | `readonly` | (`facts`) => `boolean` | Optional pure predicate over the call facts (args, sensitivity). | packages/security/src/policy/tool-argument-policy.ts:90 |
