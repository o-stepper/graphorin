[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SecretRef

# Interface: SecretRef

Defined in: packages/core/src/contracts/secret-ref.ts:9

Parsed shape of a `SecretRef` URI (`scheme:[//authority]/path[?query][#fragment]`).

The full grammar lives in `@graphorin/security`; the type lives here so
downstream packages can carry parsed refs without a security dependency.

## Stable

## Extended by

- [`ParsedSecretRef`](/api/@graphorin/security/interfaces/ParsedSecretRef.md)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-authority"></a> `authority?` | `readonly` | `string` | Optional authority component (e.g. `host[:port]`). | packages/core/src/contracts/secret-ref.ts:15 |
| <a id="property-fragment"></a> `fragment?` | `readonly` | `string` | Optional fragment (e.g. JSON-Pointer for nested fields). | packages/core/src/contracts/secret-ref.ts:21 |
| <a id="property-path"></a> `path` | `readonly` | `string` | Path component (without the leading slash for opaque schemes). | packages/core/src/contracts/secret-ref.ts:17 |
| <a id="property-query"></a> `query` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | Parsed query parameters (already percent-decoded). | packages/core/src/contracts/secret-ref.ts:19 |
| <a id="property-raw"></a> `raw` | `readonly` | `string` | Original URI string as supplied by the caller. | packages/core/src/contracts/secret-ref.ts:11 |
| <a id="property-scheme"></a> `scheme` | `readonly` | `string` | Lowercased scheme (`'env'`, `'keyring'`, `'file'`, …). | packages/core/src/contracts/secret-ref.ts:13 |
