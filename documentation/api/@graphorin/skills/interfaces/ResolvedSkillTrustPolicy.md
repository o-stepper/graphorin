[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / ResolvedSkillTrustPolicy

# Interface: ResolvedSkillTrustPolicy

Defined in: [packages/security/dist/supply-chain/types.d.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts#L107)

Trust policy applied to an install request. Auto-derived from
[SkillSource](/api/@graphorin/skills/type-aliases/SupplyChainSkillSource.md) and the optional operator override.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-audit"></a> `audit` | `readonly` | `"always"` \| `"on-violation"` | [packages/security/dist/supply-chain/types.d.ts:115](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts#L115) |
| <a id="property-ignorescripts"></a> `ignoreScripts` | `readonly` | `boolean` | [packages/security/dist/supply-chain/types.d.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts#L109) |
| <a id="property-level"></a> `level` | `readonly` | [`SkillTrustLevel`](/api/@graphorin/skills/type-aliases/SkillTrustLevel.md) | [packages/security/dist/supply-chain/types.d.ts:108](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts#L108) |
| <a id="property-sandbox"></a> `sandbox` | `readonly` | `"inherit-frontmatter"` \| `"strict-default"` | [packages/security/dist/supply-chain/types.d.ts:114](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts#L114) |
| <a id="property-signature"></a> `signature` | `readonly` | \{ `rejectIfMissing`: `boolean`; `required`: `boolean`; \} | [packages/security/dist/supply-chain/types.d.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts#L110) |
| `signature.rejectIfMissing` | `readonly` | `boolean` | [packages/security/dist/supply-chain/types.d.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts#L112) |
| `signature.required` | `readonly` | `boolean` | [packages/security/dist/supply-chain/types.d.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts#L111) |
