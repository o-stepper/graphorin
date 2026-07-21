[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SkillInstallationStatus

# Interface: SkillInstallationStatus

Defined in: packages/security/src/supply-chain/types.ts:89

**`Stable`**

Result of [installSkillFromNpm](/api/@graphorin/security/functions/installSkillFromNpm.md) / [installSkillFromGit](/api/@graphorin/security/functions/installSkillFromGit.md).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/security/src/supply-chain/types.ts:90 |
| <a id="property-ignorescripts"></a> `ignoreScripts` | `readonly` | `boolean` | packages/security/src/supply-chain/types.ts:93 |
| <a id="property-installedat"></a> `installedAt` | `readonly` | `number` | packages/security/src/supply-chain/types.ts:96 |
| <a id="property-installpath"></a> `installPath?` | `readonly` | `string` | packages/security/src/supply-chain/types.ts:98 |
| <a id="property-publisher"></a> `publisher?` | `readonly` | `string` | packages/security/src/supply-chain/types.ts:99 |
| <a id="property-signature"></a> `signature?` | `readonly` | [`SkillSignatureVerificationResult`](/api/@graphorin/security/interfaces/SkillSignatureVerificationResult.md) | packages/security/src/supply-chain/types.ts:95 |
| <a id="property-signatureverified"></a> `signatureVerified` | `readonly` | `boolean` | packages/security/src/supply-chain/types.ts:94 |
| <a id="property-source"></a> `source` | `readonly` | [`SkillSource`](/api/@graphorin/security/type-aliases/SkillSource.md) | packages/security/src/supply-chain/types.ts:91 |
| <a id="property-trustlevel"></a> `trustLevel` | `readonly` | [`SkillTrustLevel`](/api/@graphorin/security/type-aliases/SkillTrustLevel.md) | packages/security/src/supply-chain/types.ts:92 |
| <a id="property-version"></a> `version?` | `readonly` | `string` | packages/security/src/supply-chain/types.ts:97 |
