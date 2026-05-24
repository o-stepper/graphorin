[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / CreateSecretsStoreOptions

# Interface: CreateSecretsStoreOptions

Defined in: packages/security/src/secrets/factory.ts:41

Options for `createSecretsStore(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-encryptedfile"></a> `encryptedFile?` | `readonly` | [`EncryptedFileSecretsStoreOptions`](/api/@graphorin/security/interfaces/EncryptedFileSecretsStoreOptions.md) | Optional pre-built encrypted-file options. Required when activating an encrypted-file store explicitly. | packages/security/src/secrets/factory.ts:67 |
| <a id="property-env"></a> `env?` | `readonly` | [`EnvSecretsStoreOptions`](/api/@graphorin/security/interfaces/EnvSecretsStoreOptions.md) | Optional pre-built env-store options. | packages/security/src/secrets/factory.ts:62 |
| <a id="property-fallbackchain"></a> `fallbackChain?` | `readonly` | readonly (`"env"` \| `"keyring"` \| `"encrypted-file"` \| `"memory"`)[] | Explicit fallback order for the `'auto'` chain. Defaults to `['keyring', 'encrypted-file', 'env']`. | packages/security/src/secrets/factory.ts:53 |
| <a id="property-keyring"></a> `keyring?` | `readonly` | [`KeyringSecretsStoreOptions`](/api/@graphorin/security/interfaces/KeyringSecretsStoreOptions.md) | Optional pre-built keyring options forwarded to `new KeyringSecretsStore(...)`. | packages/security/src/secrets/factory.ts:58 |
| <a id="property-kind"></a> `kind?` | `readonly` | [`SecretsStoreKind`](/api/@graphorin/security/type-aliases/SecretsStoreKind.md) | Which store to activate. Defaults to `'auto'` (capability-matrix probe). | packages/security/src/secrets/factory.ts:43 |
| <a id="property-memory"></a> `memory?` | `readonly` | \{ `forceProduction?`: `boolean`; \} | Optional `MemorySecretsStore` opt-out for production-mode tests. | packages/security/src/secrets/factory.ts:71 |
| `memory.forceProduction?` | `public` | `boolean` | - | packages/security/src/secrets/stores/memory.ts:27 |
| <a id="property-strict"></a> `strict?` | `readonly` | `boolean` | Refuse to fall back when the requested primary store is unavailable. Mirrors the `--strict-secrets` CLI flag from the runtime spec. | packages/security/src/secrets/factory.ts:48 |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | Optional logger override. Defaults to the standard error stream; the framework logger arrives in a follow-on phase. | packages/security/src/secrets/factory.ts:76 |
