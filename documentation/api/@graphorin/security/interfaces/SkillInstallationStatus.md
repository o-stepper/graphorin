[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SkillInstallationStatus

# Interface: SkillInstallationStatus

Defined in: [packages/security/src/supply-chain/types.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L89)

Result of [installSkillFromNpm](/api/@graphorin/security/functions/installSkillFromNpm.md) / [installSkillFromGit](/api/@graphorin/security/functions/installSkillFromGit.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/security/src/supply-chain/types.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L90) |
| <a id="property-ignorescripts"></a> `ignoreScripts` | `readonly` | `boolean` | [packages/security/src/supply-chain/types.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L93) |
| <a id="property-installedat"></a> `installedAt` | `readonly` | `number` | [packages/security/src/supply-chain/types.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L96) |
| <a id="property-installpath"></a> `installPath?` | `readonly` | `string` | [packages/security/src/supply-chain/types.ts:98](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L98) |
| <a id="property-publisher"></a> `publisher?` | `readonly` | `string` | [packages/security/src/supply-chain/types.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L99) |
| <a id="property-signature"></a> `signature?` | `readonly` | [`SkillSignatureVerificationResult`](/api/@graphorin/security/interfaces/SkillSignatureVerificationResult.md) | [packages/security/src/supply-chain/types.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L95) |
| <a id="property-signatureverified"></a> `signatureVerified` | `readonly` | `boolean` | [packages/security/src/supply-chain/types.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L94) |
| <a id="property-source"></a> `source` | `readonly` | [`SkillSource`](/api/@graphorin/security/type-aliases/SkillSource.md) | [packages/security/src/supply-chain/types.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L91) |
| <a id="property-trustlevel"></a> `trustLevel` | `readonly` | [`SkillTrustLevel`](/api/@graphorin/security/type-aliases/SkillTrustLevel.md) | [packages/security/src/supply-chain/types.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L92) |
| <a id="property-version"></a> `version?` | `readonly` | `string` | [packages/security/src/supply-chain/types.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L97) |
