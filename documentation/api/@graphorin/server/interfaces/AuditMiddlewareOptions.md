[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / AuditMiddlewareOptions

# Interface: AuditMiddlewareOptions

Defined in: [packages/server/src/middleware/audit.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/audit.ts#L42)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-auditdb"></a> `auditDb` | `readonly` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) | - | [packages/server/src/middleware/audit.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/audit.ts#L43) |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Optional override for the time source. | [packages/server/src/middleware/audit.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/audit.ts#L45) |
| <a id="property-onerror"></a> `onError?` | `readonly` | [`AuditErrorSink`](/api/@graphorin/server/type-aliases/AuditErrorSink.md) | Optional error sink. Defaults to swallow. | [packages/server/src/middleware/audit.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/audit.ts#L47) |
| <a id="property-recordmetadata"></a> `recordMetadata?` | `readonly` | `boolean` | When `true` (the default), include the path + method + status on the audit entry's metadata. Disable for compliance-strict deployments that already log the request envelope elsewhere. | [packages/server/src/middleware/audit.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/audit.ts#L53) |
