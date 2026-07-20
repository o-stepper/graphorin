[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditExportWriter

# Interface: AuditExportWriter

Defined in: packages/security/src/audit/export.ts:28

**`Stable`**

Minimal writer abstraction. The framework deliberately does not
depend on Node's `stream` module here so consumers can pipe the
output to any sink (file, HTTP response, in-memory buffer).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-write"></a> `write` | `readonly` | (`line`) => `void` \| `Promise`\&lt;`void`\&gt; | packages/security/src/audit/export.ts:29 |
