[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / StorageStatusResult

# Interface: StorageStatusResult

Defined in: packages/cli/src/commands/storage.ts:49

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-auditdb"></a> `auditDb` | `readonly` | \{ `enabled`: `boolean`; `exists?`: `boolean`; `path?`: `string`; \} | packages/cli/src/commands/storage.ts:56 |
| `auditDb.enabled` | `readonly` | `boolean` | packages/cli/src/commands/storage.ts:57 |
| `auditDb.exists?` | `readonly` | `boolean` | packages/cli/src/commands/storage.ts:59 |
| `auditDb.path?` | `readonly` | `string` | packages/cli/src/commands/storage.ts:58 |
| <a id="property-cipherpeer"></a> `cipherPeer` | `readonly` | \{ `hint?`: `string`; `installed`: `boolean`; \} | packages/cli/src/commands/storage.ts:53 |
| `cipherPeer.hint?` | `readonly` | `string` | packages/cli/src/commands/storage.ts:53 |
| `cipherPeer.installed` | `readonly` | `boolean` | packages/cli/src/commands/storage.ts:53 |
| <a id="property-encryption"></a> `encryption` | `readonly` | \{ `cipher?`: `string`; `enabled`: `boolean`; \} | packages/cli/src/commands/storage.ts:52 |
| `encryption.cipher?` | `readonly` | `string` | packages/cli/src/commands/storage.ts:52 |
| `encryption.enabled` | `readonly` | `boolean` | packages/cli/src/commands/storage.ts:52 |
| <a id="property-maindb"></a> `mainDb` | `readonly` | \{ `exists`: `boolean`; `sizeBytes?`: `number`; \} | packages/cli/src/commands/storage.ts:54 |
| `mainDb.exists` | `readonly` | `boolean` | packages/cli/src/commands/storage.ts:54 |
| `mainDb.sizeBytes?` | `readonly` | `number` | packages/cli/src/commands/storage.ts:54 |
| <a id="property-mode"></a> `mode` | `readonly` | `"lib"` \| `"server"` | packages/cli/src/commands/storage.ts:51 |
| <a id="property-path"></a> `path` | `readonly` | `string` | packages/cli/src/commands/storage.ts:50 |
| <a id="property-walfile"></a> `walFile` | `readonly` | \{ `exists`: `boolean`; `sizeBytes?`: `number`; \} | packages/cli/src/commands/storage.ts:55 |
| `walFile.exists` | `readonly` | `boolean` | packages/cli/src/commands/storage.ts:55 |
| `walFile.sizeBytes?` | `readonly` | `number` | packages/cli/src/commands/storage.ts:55 |
