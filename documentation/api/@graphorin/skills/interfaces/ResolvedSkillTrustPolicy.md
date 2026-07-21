[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / ResolvedSkillTrustPolicy

# Interface: ResolvedSkillTrustPolicy

Defined in: [packages/security/dist/supply-chain/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts)

**`Stable`**

Trust policy applied to an install request. Auto-derived from
[SkillSource](/api/@graphorin/skills/type-aliases/SupplyChainSkillSource.md) and the optional operator override.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-audit"></a> `audit` | `readonly` | `"always"` \| `"on-violation"` | [packages/security/dist/supply-chain/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts) |
| <a id="property-ignorescripts"></a> `ignoreScripts` | `readonly` | `boolean` | [packages/security/dist/supply-chain/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts) |
| <a id="property-level"></a> `level` | `readonly` | [`SkillTrustLevel`](/api/@graphorin/skills/type-aliases/SkillTrustLevel.md) | [packages/security/dist/supply-chain/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts) |
| <a id="property-sandbox"></a> `sandbox` | `readonly` | `"inherit-frontmatter"` \| `"strict-default"` | [packages/security/dist/supply-chain/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts) |
| <a id="property-signature"></a> `signature` | `readonly` | \{ `rejectIfMissing`: `boolean`; `required`: `boolean`; \} | [packages/security/dist/supply-chain/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts) |
| `signature.rejectIfMissing` | `readonly` | `boolean` | [packages/security/dist/supply-chain/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts) |
| `signature.required` | `readonly` | `boolean` | [packages/security/dist/supply-chain/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts) |
