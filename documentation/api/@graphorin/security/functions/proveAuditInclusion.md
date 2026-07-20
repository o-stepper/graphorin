[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / proveAuditInclusion

# Function: proveAuditInclusion()

```ts
function proveAuditInclusion(
   db, 
   seq, 
head): Promise<AuditInclusionProof>;
```

Defined in: packages/security/src/audit/merkle.ts:174

**`Stable`**

Produce an RFC-6962 inclusion proof for the entry at `seq` against
the head of size `head.size`. Throws when the entry is not covered.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `db` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) |
| `seq` | `number` |
| `head` | [`AuditTreeHead`](/api/@graphorin/security/interfaces/AuditTreeHead.md) |

## Returns

`Promise`\&lt;[`AuditInclusionProof`](/api/@graphorin/security/interfaces/AuditInclusionProof.md)\&gt;
