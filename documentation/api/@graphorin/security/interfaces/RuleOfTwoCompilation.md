[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / RuleOfTwoCompilation

# Interface: RuleOfTwoCompilation

Defined in: packages/security/src/policy/tool-argument-policy.ts:259

Result of compiling a Rule-of-Two profile.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-capability"></a> `capability?` | `readonly` | `"read-only"` | The capability floor: `'read-only'` when the profile denies external side effects (so the agent runtime's capability gate blocks writer tools too), else `undefined`. | packages/security/src/policy/tool-argument-policy.ts:267 |
| <a id="property-heldlegs"></a> `heldLegs` | `readonly` | readonly [`TrifectaLeg`](/api/@graphorin/security/type-aliases/TrifectaLeg.md)[] | The legs the profile holds - `> 2` is flagged unsafe. | packages/security/src/policy/tool-argument-policy.ts:269 |
| <a id="property-holdsfulltrifecta"></a> `holdsFullTrifecta` | `readonly` | `boolean` | `true` when the profile holds all three legs (the dangerous case). | packages/security/src/policy/tool-argument-policy.ts:271 |
| <a id="property-policy"></a> `policy` | `readonly` | [`ToolArgumentPolicy`](/api/@graphorin/security/interfaces/ToolArgumentPolicy.md) | The tool-argument policy enforcing the profile at call time. | packages/security/src/policy/tool-argument-policy.ts:261 |
