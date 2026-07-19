[**Graphorin API reference v0.12.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [facade](/api/@graphorin/sessions/facade/index.md) / SessionExportOptions

# Interface: SessionExportOptions

Defined in: packages/sessions/src/facade.ts:275

**`Stable`**

Options threaded into `Session.export({...})`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-auditlimit"></a> `auditLimit?` | `readonly` | `number` | packages/sessions/src/facade.ts:282 |
| <a id="property-hash"></a> `hash?` | `readonly` | `boolean` | packages/sessions/src/facade.ts:278 |
| <a id="property-includeauditentries"></a> `includeAuditEntries?` | `readonly` | `boolean` | packages/sessions/src/facade.ts:281 |
| <a id="property-schema"></a> `schema?` | `readonly` | `"1.0"` | packages/sessions/src/facade.ts:276 |
| <a id="property-schemaurl"></a> `schemaUrl?` | `readonly` | `string` | packages/sessions/src/facade.ts:280 |
| <a id="property-sink"></a> `sink` | `readonly` | [`SessionExportSink`](/api/@graphorin/sessions/interfaces/SessionExportSink.md) | packages/sessions/src/facade.ts:277 |
| <a id="property-writer"></a> `writer?` | `readonly` | `string` | packages/sessions/src/facade.ts:279 |
