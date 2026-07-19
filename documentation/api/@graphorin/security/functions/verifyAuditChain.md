[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / verifyAuditChain

# Function: verifyAuditChain()

```ts
function verifyAuditChain(db, bounds?): Promise<AuditChainVerifyResult>;
```

Defined in: packages/security/src/audit/verify-chain.ts:20

**`Stable`**

Walk the audit chain inside the supplied bounds and return the
first divergent link (if any) plus the entry count traversed. The
function never throws; callers branch on the discriminated `ok`
field.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `db` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) |
| `bounds` | \{ `fromSeq?`: `number`; `toSeq?`: `number`; \} |
| `bounds.fromSeq?` | `number` |
| `bounds.toSeq?` | `number` |

## Returns

`Promise`\&lt;[`AuditChainVerifyResult`](/api/@graphorin/security/type-aliases/AuditChainVerifyResult.md)\&gt;
