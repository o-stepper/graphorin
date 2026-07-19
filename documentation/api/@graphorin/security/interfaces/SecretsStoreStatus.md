[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SecretsStoreStatus

# Interface: SecretsStoreStatus

Defined in: packages/security/src/secrets/factory.ts:92

**`Stable`**

Snapshot of the active store chain - surfaces in the
`/v1/health/secrets` admin endpoint (consumed by the standalone
server) and the `graphorin doctor --check-secrets` CLI command.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-active"></a> `active` | `readonly` | `"env"` \| `"keyring"` \| `"encrypted-file"` \| `"memory"` | packages/security/src/secrets/factory.ts:93 |
| <a id="property-downgradedfrom"></a> `downgradedFrom?` | `readonly` | `"env"` \| `"keyring"` \| `"encrypted-file"` \| `"memory"` | packages/security/src/secrets/factory.ts:95 |
| <a id="property-downgradereason"></a> `downgradeReason?` | `readonly` | `string` | packages/security/src/secrets/factory.ts:96 |
| <a id="property-fallbackchain"></a> `fallbackChain` | `readonly` | readonly (`"env"` \| `"keyring"` \| `"encrypted-file"` \| `"memory"`)[] | packages/security/src/secrets/factory.ts:94 |
| <a id="property-headless"></a> `headless` | `readonly` | `boolean` | packages/security/src/secrets/factory.ts:98 |
| <a id="property-headlessreasons"></a> `headlessReasons` | `readonly` | readonly `string`[] | packages/security/src/secrets/factory.ts:99 |
| <a id="property-strictmode"></a> `strictMode` | `readonly` | `boolean` | packages/security/src/secrets/factory.ts:97 |
