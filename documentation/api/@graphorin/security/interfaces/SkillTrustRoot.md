[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SkillTrustRoot

# Interface: SkillTrustRoot

Defined in: packages/security/src/supply-chain/signature.ts:246

**`Stable`**

Operator trust root for skill signatures. At least
one leg must be non-empty to trust anything. `allowSigstore` (default
`true`) exempts sigstore-resolved keys (their identity/issuer were
already checked by the verifier).

The `publishers` leg counts ONLY for keys resolved through the
`well-known` channel, whose URL host is verified to be the publisher's
domain (or a subdomain). The frontmatter `publisher` string is NOT
covered by the signature - anyone can claim any publisher - so an
inline key can never satisfy this leg (self-sign + claim
`publisher: trusted.example.com` used to pass). Inline keys require
the `fingerprints` leg.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowsigstore"></a> `allowSigstore?` | `readonly` | `boolean` | Trust sigstore-resolved keys without a fingerprint/publisher entry. Default `true`. | packages/security/src/supply-chain/signature.ts:257 |
| <a id="property-fingerprints"></a> `fingerprints?` | `readonly` | readonly `string`[] | Trusted key fingerprints (`sha256:<hex>`; matching is fold-normalised). | packages/security/src/supply-chain/signature.ts:248 |
| <a id="property-publishers"></a> `publishers?` | `readonly` | readonly `string`[] | Trusted publisher DNS names. Satisfied only by `well-known`-resolved keys whose URL host equals the publisher (or is its subdomain) - control of the HTTPS endpoint on the publisher's domain is the one channel that can vouch for the unsigned `publisher` string. | packages/security/src/supply-chain/signature.ts:255 |
