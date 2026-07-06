[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / SkillSignatureVerificationResult

# Interface: SkillSignatureVerificationResult

Defined in: [packages/security/dist/supply-chain/types.d.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts#L76)

Result of a `verifySkillSignature` call.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-fingerprint"></a> `fingerprint?` | `readonly` | `string` | [packages/security/dist/supply-chain/types.d.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts#L81) |
| <a id="property-publickeysource"></a> `publicKeySource` | `readonly` | `"inline"` \| `"well-known"` \| `"sigstore"` | [packages/security/dist/supply-chain/types.d.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts#L80) |
| <a id="property-publisher"></a> `publisher` | `readonly` | `string` | [packages/security/dist/supply-chain/types.d.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts#L79) |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | [packages/security/dist/supply-chain/types.d.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts#L82) |
| <a id="property-signerid"></a> `signerId?` | `readonly` | `string` | [packages/security/dist/supply-chain/types.d.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts#L78) |
| <a id="property-valid"></a> `valid` | `readonly` | `boolean` | [packages/security/dist/supply-chain/types.d.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts#L77) |
