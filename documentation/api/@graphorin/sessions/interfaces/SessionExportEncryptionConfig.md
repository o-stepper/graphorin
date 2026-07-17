[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportEncryptionConfig

# Interface: SessionExportEncryptionConfig

Defined in: [packages/sessions/src/export/writer.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/writer.ts#L63)

Configuration for opt-in `--encrypt` / `--sign`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cipher"></a> `cipher?` | `readonly` | `"aes256gcm"` | - | [packages/sessions/src/export/writer.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/writer.ts#L64) |
| <a id="property-key"></a> `key?` | `readonly` | `Uint8Array`\&lt;`ArrayBufferLike`\&gt; | Pre-derived 32-byte key. Mutually exclusive with `passphrase`. Use [deriveSessionExportKey](/api/@graphorin/sessions/functions/deriveSessionExportKey.md) to pre-derive deterministically from a passphrase. | [packages/sessions/src/export/writer.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/writer.ts#L70) |
| <a id="property-passphrase"></a> `passphrase?` | `readonly` | `string` \| `Uint8Array`\&lt;`ArrayBufferLike`\&gt; | Passphrase + salt the writer derives a key from at write time. The same salt MUST be supplied to the importer. | [packages/sessions/src/export/writer.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/writer.ts#L75) |
| <a id="property-salt"></a> `salt?` | `readonly` | `Uint8Array`\&lt;`ArrayBufferLike`\&gt; | - | [packages/sessions/src/export/writer.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/writer.ts#L76) |
