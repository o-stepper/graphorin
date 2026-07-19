[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ResolvedSkillTrustPolicy

# Interface: ResolvedSkillTrustPolicy

Defined in: packages/security/src/supply-chain/types.ts:108

**`Stable`**

Trust policy applied to an install request. Auto-derived from
[SkillSource](/api/@graphorin/security/type-aliases/SkillSource.md) and the optional operator override.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-audit"></a> `audit` | `readonly` | `"always"` \| `"on-violation"` | packages/security/src/supply-chain/types.ts:113 |
| <a id="property-ignorescripts"></a> `ignoreScripts` | `readonly` | `boolean` | packages/security/src/supply-chain/types.ts:110 |
| <a id="property-level"></a> `level` | `readonly` | [`SkillTrustLevel`](/api/@graphorin/security/type-aliases/SkillTrustLevel.md) | packages/security/src/supply-chain/types.ts:109 |
| <a id="property-sandbox"></a> `sandbox` | `readonly` | `"inherit-frontmatter"` \| `"strict-default"` | packages/security/src/supply-chain/types.ts:112 |
| <a id="property-signature"></a> `signature` | `readonly` | \{ `rejectIfMissing`: `boolean`; `required`: `boolean`; \} | packages/security/src/supply-chain/types.ts:111 |
| `signature.rejectIfMissing` | `readonly` | `boolean` | packages/security/src/supply-chain/types.ts:111 |
| `signature.required` | `readonly` | `boolean` | packages/security/src/supply-chain/types.ts:111 |
