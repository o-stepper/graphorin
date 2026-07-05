[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / SkillSignatureVerificationResult

# Interface: SkillSignatureVerificationResult

Defined in: packages/security/dist/supply-chain/types.d.ts:76

Result of a verifySkillSignature call.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-fingerprint"></a> `fingerprint?` | `readonly` | `string` | packages/security/dist/supply-chain/types.d.ts:81 |
| <a id="property-publickeysource"></a> `publicKeySource` | `readonly` | `"inline"` \| `"well-known"` \| `"sigstore"` | packages/security/dist/supply-chain/types.d.ts:80 |
| <a id="property-publisher"></a> `publisher` | `readonly` | `string` | packages/security/dist/supply-chain/types.d.ts:79 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | packages/security/dist/supply-chain/types.d.ts:82 |
| <a id="property-signerid"></a> `signerId?` | `readonly` | `string` | packages/security/dist/supply-chain/types.d.ts:78 |
| <a id="property-valid"></a> `valid` | `readonly` | `boolean` | packages/security/dist/supply-chain/types.d.ts:77 |
