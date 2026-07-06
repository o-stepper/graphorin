[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / openAuditDb

# Function: openAuditDb()

```ts
function openAuditDb(options): Promise<AuditDb>;
```

Defined in: [packages/security/src/audit/audit-db.ts:202](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/audit-db.ts#L202)

Open an audit database. The function fails fast with
`AuditDbCipherUnavailableError` when no binding is registered, or
when the requested binding identifier is unknown.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`OpenAuditDbOptions`](/api/@graphorin/security/interfaces/OpenAuditDbOptions.md) |

## Returns

`Promise`\&lt;[`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md)\&gt;

## Stable
