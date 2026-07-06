[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditExportWriter

# Interface: AuditExportWriter

Defined in: packages/security/src/audit/export.ts:28

Minimal writer abstraction. The framework deliberately does not
depend on Node's `stream` module here so consumers can pipe the
output to any sink (file, HTTP response, in-memory buffer).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-write"></a> `write` | `readonly` | (`line`) => `void` \| `Promise`\<`void`\> | packages/security/src/audit/export.ts:29 |
