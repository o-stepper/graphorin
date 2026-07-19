[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SecretMetadata

# Interface: SecretMetadata

Defined in: packages/core/src/contracts/secrets-store.ts:83

**`Stable`**

Public metadata about a stored secret. Safe to log - never carries the
value itself.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | packages/core/src/contracts/secrets-store.ts:85 |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `string` | packages/core/src/contracts/secrets-store.ts:87 |
| <a id="property-key"></a> `key` | `readonly` | `string` | packages/core/src/contracts/secrets-store.ts:84 |
| <a id="property-source"></a> `source?` | `readonly` | `string` | packages/core/src/contracts/secrets-store.ts:89 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | packages/core/src/contracts/secrets-store.ts:88 |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | packages/core/src/contracts/secrets-store.ts:86 |
