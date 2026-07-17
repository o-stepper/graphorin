[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / StorageStatusResult

# Interface: StorageStatusResult

Defined in: [packages/cli/src/commands/storage.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L53)

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-auditdb"></a> `auditDb` | `readonly` | \{ `enabled`: `boolean`; `exists?`: `boolean`; `path?`: `string`; \} | [packages/cli/src/commands/storage.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L60) |
| `auditDb.enabled` | `readonly` | `boolean` | [packages/cli/src/commands/storage.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L61) |
| `auditDb.exists?` | `readonly` | `boolean` | [packages/cli/src/commands/storage.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L63) |
| `auditDb.path?` | `readonly` | `string` | [packages/cli/src/commands/storage.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L62) |
| <a id="property-cipherpeer"></a> `cipherPeer` | `readonly` | \{ `hint?`: `string`; `installed`: `boolean`; \} | [packages/cli/src/commands/storage.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L57) |
| `cipherPeer.hint?` | `readonly` | `string` | [packages/cli/src/commands/storage.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L57) |
| `cipherPeer.installed` | `readonly` | `boolean` | [packages/cli/src/commands/storage.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L57) |
| <a id="property-encryption"></a> `encryption` | `readonly` | \{ `cipher?`: `string`; `enabled`: `boolean`; \} | [packages/cli/src/commands/storage.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L56) |
| `encryption.cipher?` | `readonly` | `string` | [packages/cli/src/commands/storage.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L56) |
| `encryption.enabled` | `readonly` | `boolean` | [packages/cli/src/commands/storage.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L56) |
| <a id="property-maindb"></a> `mainDb` | `readonly` | \{ `exists`: `boolean`; `sizeBytes?`: `number`; \} | [packages/cli/src/commands/storage.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L58) |
| `mainDb.exists` | `readonly` | `boolean` | [packages/cli/src/commands/storage.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L58) |
| `mainDb.sizeBytes?` | `readonly` | `number` | [packages/cli/src/commands/storage.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L58) |
| <a id="property-mode"></a> `mode` | `readonly` | `"lib"` \| `"server"` | [packages/cli/src/commands/storage.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L55) |
| <a id="property-path"></a> `path` | `readonly` | `string` | [packages/cli/src/commands/storage.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L54) |
| <a id="property-walfile"></a> `walFile` | `readonly` | \{ `exists`: `boolean`; `sizeBytes?`: `number`; \} | [packages/cli/src/commands/storage.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L59) |
| `walFile.exists` | `readonly` | `boolean` | [packages/cli/src/commands/storage.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L59) |
| `walFile.sizeBytes?` | `readonly` | `number` | [packages/cli/src/commands/storage.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L59) |
