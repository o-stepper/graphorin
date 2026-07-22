[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportReadOptions

# Interface: SessionExportReadOptions

Defined in: packages/sessions/src/export/reader.ts:72

**`Stable`**

Options accepted by [readSessionExport](/api/@graphorin/sessions/functions/readSessionExport.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-activeembedderids"></a> `activeEmbedderIds?` | `readonly` | readonly `string`[] | When the meta header declares one or more `embedderIds` that do not match the supplied `activeEmbedderIds` set, embeddings on imported messages are dropped (with a warning per embedder). Defaults to an empty set, meaning embeddings are always dropped (the safest default - embeddings produced under a different embedder are not interchangeable byte-for-byte). | packages/sessions/src/export/reader.ts:81 |
| <a id="property-decryptionkey"></a> `decryptionKey?` | `readonly` | `Uint8Array`\&lt;`ArrayBufferLike`\&gt; | When the file was written with `--encrypt`, supply the matching key + salt. Required when the footer surfaces `cipher`. | packages/sessions/src/export/reader.ts:86 |
| <a id="property-onwarn"></a> `onWarn?` | `readonly` | (`warning`) => `void` | Provide a custom logger for warnings. The framework default emits to `console.warn`; pass `() => {}` to silence. | packages/sessions/src/export/reader.ts:91 |
