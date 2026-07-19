[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / verifyAuditInclusion

# Function: verifyAuditInclusion()

```ts
function verifyAuditInclusion(
   entry, 
   proof, 
   head): boolean;
```

Defined in: packages/security/src/audit/merkle.ts:211

**`Stable`**

Verify an inclusion proof (RFC 6962 §2.1.1 verification algorithm) -
pure; needs only the entry, the proof, and the trusted head.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `entry` | [`StoredAuditEntry`](/api/@graphorin/security/interfaces/StoredAuditEntry.md) |
| `proof` | [`AuditInclusionProof`](/api/@graphorin/security/interfaces/AuditInclusionProof.md) |
| `head` | [`AuditTreeHead`](/api/@graphorin/security/interfaces/AuditTreeHead.md) |

## Returns

`boolean`
