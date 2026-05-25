[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / VerifySkillSignatureOptions

# Interface: VerifySkillSignatureOptions

Defined in: packages/security/src/supply-chain/signature.ts:73

Options accepted by [verifySkillSignature](/api/@graphorin/security/functions/verifySkillSignature.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-publickeyfetcher"></a> `publicKeyFetcher?` | `readonly` | [`PublicKeyFetcher`](/api/@graphorin/security/type-aliases/PublicKeyFetcher.md) | Optional pre-installed strategy registry override. | packages/security/src/supply-chain/signature.ts:85 |
| <a id="property-publickeysource"></a> `publicKeySource?` | `readonly` | \{ `publicKeyPem`: `string`; `publisher?`: `string`; \} | When supplied, overrides the `publicKeyRef` block discovered in the frontmatter. Useful for offline verification with a pinned publisher key. | packages/security/src/supply-chain/signature.ts:81 |
| `publicKeySource.publicKeyPem` | `readonly` | `string` | - | packages/security/src/supply-chain/signature.ts:81 |
| `publicKeySource.publisher?` | `readonly` | `string` | - | packages/security/src/supply-chain/signature.ts:81 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Cancellation. | packages/security/src/supply-chain/signature.ts:83 |
| <a id="property-sigstoreverifier"></a> `sigstoreVerifier?` | `readonly` | [`SigstoreVerifier`](/api/@graphorin/security/type-aliases/SigstoreVerifier.md) | - | packages/security/src/supply-chain/signature.ts:86 |
| <a id="property-skillmd"></a> `skillMd` | `readonly` | `string` | Raw SKILL.md content (UTF-8 string). | packages/security/src/supply-chain/signature.ts:75 |
