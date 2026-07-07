[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SkillSignatureVerificationResult

# Interface: SkillSignatureVerificationResult

Defined in: [packages/security/src/supply-chain/types.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L75)

Result of a `verifySkillSignature` call.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-fingerprint"></a> `fingerprint?` | `readonly` | `string` | [packages/security/src/supply-chain/types.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L80) |
| <a id="property-publickeysource"></a> `publicKeySource` | `readonly` | `"inline"` \| `"well-known"` \| `"sigstore"` | [packages/security/src/supply-chain/types.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L79) |
| <a id="property-publisher"></a> `publisher` | `readonly` | `string` | [packages/security/src/supply-chain/types.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L78) |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | [packages/security/src/supply-chain/types.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L81) |
| <a id="property-signerid"></a> `signerId?` | `readonly` | `string` | [packages/security/src/supply-chain/types.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L77) |
| <a id="property-valid"></a> `valid` | `readonly` | `boolean` | [packages/security/src/supply-chain/types.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L76) |
