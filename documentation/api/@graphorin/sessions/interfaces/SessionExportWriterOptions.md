[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportWriterOptions

# Interface: SessionExportWriterOptions

Defined in: packages/sessions/src/export/writer.ts:27

**`Stable`**

Options accepted by [createSessionExportWriter](/api/@graphorin/sessions/functions/createSessionExportWriter.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-embedderids"></a> `embedderIds?` | `readonly` | readonly `string`[] | Active embedder ids, surfaced for embedder-mismatch import handling. | packages/sessions/src/export/writer.ts:40 |
| <a id="property-encrypt"></a> `encrypt?` | `readonly` | [`SessionExportEncryptionConfig`](/api/@graphorin/sessions/interfaces/SessionExportEncryptionConfig.md) | AES-256-GCM passphrase. When supplied the writer XORs every body byte with the keystream and writes the cipher metadata on the footer. The key is derived via `crypto.scryptSync(passphrase, salt, 32)` for forward compatibility with Node's crypto APIs. Encryption is intentionally header-and-footer aware: the meta header + footer remain plaintext so importers can fail fast with a precise error before consuming the body. | packages/sessions/src/export/writer.ts:53 |
| <a id="property-hash"></a> `hash?` | `readonly` | `boolean` | Compute a SHA-256 of the body bytes and write it on the footer. | packages/sessions/src/export/writer.ts:42 |
| <a id="property-minruntimeversion"></a> `minRuntimeVersion?` | `readonly` | `string` | Minimum runtime version that can read the resulting file. | packages/sessions/src/export/writer.ts:31 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Override `Date.now()` for tests. | packages/sessions/src/export/writer.ts:55 |
| <a id="property-schemaurl"></a> `schemaUrl?` | `readonly` | `string` | Optional `schemaUrl` to embed in the meta header. Conventionally a stable URL that serves the JSON Schema document for the session export format - for example a `raw.githubusercontent.com` URL pointing at the schema file in this repository. | packages/sessions/src/export/writer.ts:38 |
| <a id="property-writer"></a> `writer` | `readonly` | `string` | Writer identifier surfaced in the meta header (e.g. `graphorin-cli@<version>`). | packages/sessions/src/export/writer.ts:29 |
