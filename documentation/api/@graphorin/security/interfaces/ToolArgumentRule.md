[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ToolArgumentRule

# Interface: ToolArgumentRule

Defined in: [packages/security/src/policy/tool-argument-policy.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L52)

A single Progent rule. `forbid` always beats `allow` (see module doc).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-effect"></a> `effect` | `readonly` | `"allow"` \| `"forbid"` | - | [packages/security/src/policy/tool-argument-policy.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L53) |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | Human-readable reason surfaced on a `forbid` match. | [packages/security/src/policy/tool-argument-policy.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L62) |
| <a id="property-tool"></a> `tool` | `readonly` | `string` | Tool-name matcher: an exact name, `'*'` for any, or a trailing-`*` prefix glob (e.g. `'fs_*'`). Matching is case-sensitive. | [packages/security/src/policy/tool-argument-policy.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L58) |
| <a id="property-when"></a> `when?` | `readonly` | (`facts`) => `boolean` | Optional pure predicate over the call facts (args, sensitivity). | [packages/security/src/policy/tool-argument-policy.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L60) |
