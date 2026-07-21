[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / EncryptedFileSecretsStoreOptions

# Interface: EncryptedFileSecretsStoreOptions

Defined in: packages/security/src/secrets/stores/encrypted-file.ts:27

**`Stable`**

Options for `EncryptedFileSecretsStore`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-enforcepermissions"></a> `enforcePermissions?` | `readonly` | `boolean` | Whether to enforce mode `0o600` on the bundle when writing. The default (`true`) is the recommended configuration; tests on platforms without POSIX mode bits opt out. | packages/security/src/secrets/stores/encrypted-file.ts:37 |
| <a id="property-passphrase"></a> `passphrase` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | Passphrase wrapped in a `SecretValue`. | packages/security/src/secrets/stores/encrypted-file.ts:31 |
| <a id="property-path"></a> `path` | `readonly` | `string` | Absolute path to the bundle file. Tilde expansion supported. | packages/security/src/secrets/stores/encrypted-file.ts:29 |
