[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditExportWriter

# Interface: AuditExportWriter

Defined in: packages/security/src/audit/export.ts:21

Minimal writer abstraction. The framework deliberately does not
depend on Node's `stream` module here so consumers can pipe the
output to any sink (file, HTTP response, in-memory buffer).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-write"></a> `write` | `readonly` | (`line`) => `void` \| `Promise`\&lt;`void`\&gt; | packages/security/src/audit/export.ts:22 |
