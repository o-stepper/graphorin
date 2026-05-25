[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportWarning

# Interface: SessionExportWarning

Defined in: packages/sessions/src/export/reader.ts:55

Lifecycle event surfaced by the reader. Every `'unknown-record'`
+ every `'schema-future-minor'` triggers exactly one warning.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | \| `"unknown-record"` \| `"schema-future-minor"` \| `"embedder-mismatch-dropped"` \| `"reasoning-meta-extension"` | packages/sessions/src/export/reader.ts:56 |
| <a id="property-message"></a> `message` | `readonly` | `string` | packages/sessions/src/export/reader.ts:61 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/sessions/src/export/reader.ts:62 |
