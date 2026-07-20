[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SkillSignatureBlock

# Interface: SkillSignatureBlock

Defined in: packages/security/src/supply-chain/types.ts:41

**`Stable`**

Parsed form of a `graphorin-signature:` block from a SKILL.md.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-algorithm"></a> `algorithm` | `readonly` | `"ed25519-sha256"` | packages/security/src/supply-chain/types.ts:42 |
| <a id="property-publickeyref"></a> `publicKeyRef` | `readonly` | [`SkillPublicKeyRef`](/api/@graphorin/security/type-aliases/SkillPublicKeyRef.md) | packages/security/src/supply-chain/types.ts:46 |
| <a id="property-publishedat"></a> `publishedAt` | `readonly` | `string` | packages/security/src/supply-chain/types.ts:44 |
| <a id="property-publisher"></a> `publisher` | `readonly` | `string` | packages/security/src/supply-chain/types.ts:43 |
| <a id="property-signature"></a> `signature` | `readonly` | `string` | packages/security/src/supply-chain/types.ts:45 |
