[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / auditLeafHash

# Function: auditLeafHash()

```ts
function auditLeafHash(entry): Buffer;
```

Defined in: packages/security/src/audit/merkle.ts:47

RFC 6962 leaf hash: `SHA-256(0x00 || leaf-bytes)`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `entry` | [`StoredAuditEntry`](/api/@graphorin/security/interfaces/StoredAuditEntry.md) |

## Returns

`Buffer`
