[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / ResolvedSkillTrustPolicy

# Interface: ResolvedSkillTrustPolicy

Defined in: packages/security/dist/supply-chain/types.d.ts:107

Trust policy applied to an install request. Auto-derived from
[SkillSource](/api/@graphorin/skills/type-aliases/SupplyChainSkillSource.md) and the optional operator override.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-audit"></a> `audit` | `readonly` | `"always"` \| `"on-violation"` | packages/security/dist/supply-chain/types.d.ts:115 |
| <a id="property-ignorescripts"></a> `ignoreScripts` | `readonly` | `boolean` | packages/security/dist/supply-chain/types.d.ts:109 |
| <a id="property-level"></a> `level` | `readonly` | [`SkillTrustLevel`](/api/@graphorin/skills/type-aliases/SkillTrustLevel.md) | packages/security/dist/supply-chain/types.d.ts:108 |
| <a id="property-sandbox"></a> `sandbox` | `readonly` | `"inherit-frontmatter"` \| `"strict-default"` | packages/security/dist/supply-chain/types.d.ts:114 |
| <a id="property-signature"></a> `signature` | `readonly` | \{ `rejectIfMissing`: `boolean`; `required`: `boolean`; \} | packages/security/dist/supply-chain/types.d.ts:110 |
| `signature.rejectIfMissing` | `readonly` | `boolean` | packages/security/dist/supply-chain/types.d.ts:112 |
| `signature.required` | `readonly` | `boolean` | packages/security/dist/supply-chain/types.d.ts:111 |
