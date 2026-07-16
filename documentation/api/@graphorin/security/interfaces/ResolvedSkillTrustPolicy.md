[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ResolvedSkillTrustPolicy

# Interface: ResolvedSkillTrustPolicy

Defined in: [packages/security/src/supply-chain/types.ts:108](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L108)

Trust policy applied to an install request. Auto-derived from
[SkillSource](/api/@graphorin/security/type-aliases/SkillSource.md) and the optional operator override.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-audit"></a> `audit` | `readonly` | `"always"` \| `"on-violation"` | [packages/security/src/supply-chain/types.ts:113](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L113) |
| <a id="property-ignorescripts"></a> `ignoreScripts` | `readonly` | `boolean` | [packages/security/src/supply-chain/types.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L110) |
| <a id="property-level"></a> `level` | `readonly` | [`SkillTrustLevel`](/api/@graphorin/security/type-aliases/SkillTrustLevel.md) | [packages/security/src/supply-chain/types.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L109) |
| <a id="property-sandbox"></a> `sandbox` | `readonly` | `"inherit-frontmatter"` \| `"strict-default"` | [packages/security/src/supply-chain/types.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L112) |
| <a id="property-signature"></a> `signature` | `readonly` | \{ `rejectIfMissing`: `boolean`; `required`: `boolean`; \} | [packages/security/src/supply-chain/types.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L111) |
| `signature.rejectIfMissing` | `readonly` | `boolean` | [packages/security/src/supply-chain/types.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L111) |
| `signature.required` | `readonly` | `boolean` | [packages/security/src/supply-chain/types.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L111) |
