[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ExportAuditOptions

# Interface: ExportAuditOptions

Defined in: packages/security/src/audit/export.ts:30

Options for `exportAudit(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-fromseq"></a> `fromSeq?` | `readonly` | `number` | - | packages/security/src/audit/export.ts:31 |
| <a id="property-include"></a> `include?` | `readonly` | (`entry`) => `boolean` | Predicate to filter individual entries. | packages/security/src/audit/export.ts:35 |
| <a id="property-toseq"></a> `toSeq?` | `readonly` | `number` | - | packages/security/src/audit/export.ts:32 |
| <a id="property-writer"></a> `writer` | `readonly` | [`AuditExportWriter`](/api/@graphorin/security/interfaces/AuditExportWriter.md) | - | packages/security/src/audit/export.ts:33 |
