[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportEncryptionConfig

# Interface: SessionExportEncryptionConfig

Defined in: packages/sessions/src/export/writer.ts:63

**`Stable`**

Configuration for opt-in `--encrypt` / `--sign`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cipher"></a> `cipher?` | `readonly` | `"aes256gcm"` | - | packages/sessions/src/export/writer.ts:64 |
| <a id="property-key"></a> `key?` | `readonly` | `Uint8Array`\&lt;`ArrayBufferLike`\&gt; | Pre-derived 32-byte key. Mutually exclusive with `passphrase`. Use [deriveSessionExportKey](/api/@graphorin/sessions/functions/deriveSessionExportKey.md) to pre-derive deterministically from a passphrase. | packages/sessions/src/export/writer.ts:70 |
| <a id="property-passphrase"></a> `passphrase?` | `readonly` | `string` \| `Uint8Array`\&lt;`ArrayBufferLike`\&gt; | Passphrase + salt the writer derives a key from at write time. The same salt MUST be supplied to the importer. | packages/sessions/src/export/writer.ts:75 |
| <a id="property-salt"></a> `salt?` | `readonly` | `Uint8Array`\&lt;`ArrayBufferLike`\&gt; | - | packages/sessions/src/export/writer.ts:76 |
