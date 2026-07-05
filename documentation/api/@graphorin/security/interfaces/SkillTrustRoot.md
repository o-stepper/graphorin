[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SkillTrustRoot

# Interface: SkillTrustRoot

Defined in: packages/security/src/supply-chain/signature.ts:240

Operator trust root for skill signatures (D4 / security-01). At least
one leg must be non-empty to trust anything: a signer is accepted when
its resolved key fingerprint is in `fingerprints` OR its publisher is
in `publishers`. `allowSigstore` (default `true`) exempts sigstore-
resolved keys (their identity/issuer were already checked by the
verifier). Treat an inline key absent from the root as unverified.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowsigstore"></a> `allowSigstore?` | `readonly` | `boolean` | Trust sigstore-resolved keys without a fingerprint/publisher entry. Default `true`. | packages/security/src/supply-chain/signature.ts:246 |
| <a id="property-fingerprints"></a> `fingerprints?` | `readonly` | readonly `string`[] | Trusted key fingerprints (`sha256:<hex>`; matching is fold-normalised). | packages/security/src/supply-chain/signature.ts:242 |
| <a id="property-publishers"></a> `publishers?` | `readonly` | readonly `string`[] | Trusted publisher identifiers (exact match against the `publisher` field). | packages/security/src/supply-chain/signature.ts:244 |
