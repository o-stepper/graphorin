[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ExportAuditOptions

# Interface: ExportAuditOptions

Defined in: [packages/security/src/audit/export.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/export.ts#L37)

Options for `exportAudit(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-fromseq"></a> `fromSeq?` | `readonly` | `number` | - | [packages/security/src/audit/export.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/export.ts#L38) |
| <a id="property-include"></a> `include?` | `readonly` | (`entry`) => `boolean` | Predicate to filter individual entries. | [packages/security/src/audit/export.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/export.ts#L42) |
| <a id="property-toseq"></a> `toSeq?` | `readonly` | `number` | - | [packages/security/src/audit/export.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/export.ts#L39) |
| <a id="property-writer"></a> `writer` | `readonly` | [`AuditExportWriter`](/api/@graphorin/security/interfaces/AuditExportWriter.md) | - | [packages/security/src/audit/export.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/export.ts#L40) |
