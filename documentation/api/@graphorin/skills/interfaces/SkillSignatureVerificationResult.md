[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / SkillSignatureVerificationResult

# Interface: SkillSignatureVerificationResult

Defined in: [packages/security/dist/supply-chain/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts)

**`Stable`**

Result of a `verifySkillSignature` call.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-fingerprint"></a> `fingerprint?` | `readonly` | `string` | [packages/security/dist/supply-chain/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts) |
| <a id="property-publickeysource"></a> `publicKeySource` | `readonly` | `"inline"` \| `"well-known"` \| `"sigstore"` | [packages/security/dist/supply-chain/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts) |
| <a id="property-publisher"></a> `publisher` | `readonly` | `string` | [packages/security/dist/supply-chain/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts) |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | [packages/security/dist/supply-chain/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts) |
| <a id="property-signerid"></a> `signerId?` | `readonly` | `string` | [packages/security/dist/supply-chain/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts) |
| <a id="property-valid"></a> `valid` | `readonly` | `boolean` | [packages/security/dist/supply-chain/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts) |
