[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportWarning

# Interface: SessionExportWarning

Defined in: [packages/sessions/src/export/reader.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/reader.ts#L56)

Lifecycle event surfaced by the reader. Every `'unknown-record'`
+ every `'schema-future-minor'` triggers exactly one warning.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | \| `"unknown-record"` \| `"schema-future-minor"` \| `"embedder-mismatch-dropped"` \| `"reasoning-meta-extension"` \| `"footer-count-mismatch"` | [packages/sessions/src/export/reader.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/reader.ts#L57) |
| <a id="property-message"></a> `message` | `readonly` | `string` | [packages/sessions/src/export/reader.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/reader.ts#L63) |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | [packages/sessions/src/export/reader.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/reader.ts#L64) |
