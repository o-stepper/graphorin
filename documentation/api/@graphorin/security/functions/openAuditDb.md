[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / openAuditDb

# Function: openAuditDb()

```ts
function openAuditDb(options): Promise<AuditDb>;
```

Defined in: packages/security/src/audit/audit-db.ts:187

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
