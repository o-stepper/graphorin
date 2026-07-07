[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SecretMetadata

# Interface: SecretMetadata

Defined in: [packages/core/src/contracts/secrets-store.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L83)

Public metadata about a stored secret. Safe to log - never carries the
value itself.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | [packages/core/src/contracts/secrets-store.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L85) |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `string` | [packages/core/src/contracts/secrets-store.ts:87](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L87) |
| <a id="property-key"></a> `key` | `readonly` | `string` | [packages/core/src/contracts/secrets-store.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L84) |
| <a id="property-source"></a> `source?` | `readonly` | `string` | [packages/core/src/contracts/secrets-store.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L89) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | [packages/core/src/contracts/secrets-store.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L88) |
| <a id="property-updatedat"></a> `updatedAt?` | `readonly` | `string` | [packages/core/src/contracts/secrets-store.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L86) |
