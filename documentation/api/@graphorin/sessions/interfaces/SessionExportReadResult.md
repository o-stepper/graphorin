[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportReadResult

# Interface: SessionExportReadResult

Defined in: [packages/sessions/src/export/reader.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/reader.ts#L43)

Read result: a sequenced parse of every record plus the optional
sentinel header / footer surfaced explicitly.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-footer"></a> `footer` | `readonly` | [`SessionExportFooterRecord`](/api/@graphorin/sessions/interfaces/SessionExportFooterRecord.md) | [packages/sessions/src/export/reader.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/reader.ts#L46) |
| <a id="property-meta"></a> `meta` | `readonly` | [`SessionExportMetaRecord`](/api/@graphorin/sessions/interfaces/SessionExportMetaRecord.md) | [packages/sessions/src/export/reader.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/reader.ts#L44) |
| <a id="property-records"></a> `records` | `readonly` | readonly [`SessionExportParsedRecord`](/api/@graphorin/sessions/type-aliases/SessionExportParsedRecord.md)[] | [packages/sessions/src/export/reader.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/reader.ts#L45) |
| <a id="property-warnings"></a> `warnings` | `readonly` | readonly [`SessionExportWarning`](/api/@graphorin/sessions/interfaces/SessionExportWarning.md)[] | [packages/sessions/src/export/reader.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/reader.ts#L47) |
