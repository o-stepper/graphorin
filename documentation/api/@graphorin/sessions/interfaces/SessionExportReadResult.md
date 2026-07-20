[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportReadResult

# Interface: SessionExportReadResult

Defined in: packages/sessions/src/export/reader.ts:43

**`Stable`**

Read result: a sequenced parse of every record plus the optional
sentinel header / footer surfaced explicitly.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-footer"></a> `footer` | `readonly` | [`SessionExportFooterRecord`](/api/@graphorin/sessions/interfaces/SessionExportFooterRecord.md) | packages/sessions/src/export/reader.ts:46 |
| <a id="property-meta"></a> `meta` | `readonly` | [`SessionExportMetaRecord`](/api/@graphorin/sessions/interfaces/SessionExportMetaRecord.md) | packages/sessions/src/export/reader.ts:44 |
| <a id="property-records"></a> `records` | `readonly` | readonly [`SessionExportParsedRecord`](/api/@graphorin/sessions/type-aliases/SessionExportParsedRecord.md)[] | packages/sessions/src/export/reader.ts:45 |
| <a id="property-warnings"></a> `warnings` | `readonly` | readonly [`SessionExportWarning`](/api/@graphorin/sessions/interfaces/SessionExportWarning.md)[] | packages/sessions/src/export/reader.ts:47 |
