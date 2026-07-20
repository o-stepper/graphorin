[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ParsedSecretRef

# Interface: ParsedSecretRef

Defined in: packages/security/src/secrets/secret-ref.ts:57

**`Stable`**

Internal parsed shape for a single `SecretRef` URI. Conforms to the
cross-package `SecretRef` contract declared in `@graphorin/core` and
adds nothing on top of it - richer access (split authority, per-key
multi-value query) is exposed through dedicated helpers below.

## Extends

- [`SecretRef`](/api/@graphorin/core/interfaces/SecretRef.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-authority"></a> `authority?` | `readonly` | `string` | Optional authority component (e.g. `host[:port]`). | [`SecretRef`](/api/@graphorin/core/interfaces/SecretRef.md).[`authority`](/api/@graphorin/core/interfaces/SecretRef.md#property-authority) | packages/security/src/secrets/secret-ref.ts:60 |
| <a id="property-fragment"></a> `fragment?` | `readonly` | `string` | Optional fragment (e.g. JSON-Pointer for nested fields). | [`SecretRef`](/api/@graphorin/core/interfaces/SecretRef.md).[`fragment`](/api/@graphorin/core/interfaces/SecretRef.md#property-fragment) | packages/security/src/secrets/secret-ref.ts:63 |
| <a id="property-path"></a> `path` | `readonly` | `string` | Path component (without the leading slash for opaque schemes). | [`SecretRef`](/api/@graphorin/core/interfaces/SecretRef.md).[`path`](/api/@graphorin/core/interfaces/SecretRef.md#property-path) | packages/security/src/secrets/secret-ref.ts:61 |
| <a id="property-query"></a> `query` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | Parsed query parameters (already percent-decoded). | [`SecretRef`](/api/@graphorin/core/interfaces/SecretRef.md).[`query`](/api/@graphorin/core/interfaces/SecretRef.md#property-query) | packages/security/src/secrets/secret-ref.ts:62 |
| <a id="property-raw"></a> `raw` | `readonly` | `string` | Original URI string as supplied by the caller. | [`SecretRef`](/api/@graphorin/core/interfaces/SecretRef.md).[`raw`](/api/@graphorin/core/interfaces/SecretRef.md#property-raw) | packages/security/src/secrets/secret-ref.ts:58 |
| <a id="property-scheme"></a> `scheme` | `readonly` | `string` | Lowercased scheme (`'env'`, `'keyring'`, `'file'`, …). | [`SecretRef`](/api/@graphorin/core/interfaces/SecretRef.md).[`scheme`](/api/@graphorin/core/interfaces/SecretRef.md#property-scheme) | packages/security/src/secrets/secret-ref.ts:59 |
