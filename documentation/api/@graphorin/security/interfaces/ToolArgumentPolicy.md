[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ToolArgumentPolicy

# Interface: ToolArgumentPolicy

Defined in: packages/security/src/policy/tool-argument-policy.ts:96

A compiled tool-argument policy.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-defaultdenysensitive"></a> `defaultDenySensitive?` | `readonly` | `boolean` | Default-deny a `sensitive` tool with no matching `allow` rule (Progent's posture for high-risk tools). Default `false` - a policy with no rules and this off is a no-op (allows everything). | packages/security/src/policy/tool-argument-policy.ts:103 |
| <a id="property-rules"></a> `rules` | `readonly` | readonly [`ToolArgumentRule`](/api/@graphorin/security/interfaces/ToolArgumentRule.md)[] | - | packages/security/src/policy/tool-argument-policy.ts:97 |
