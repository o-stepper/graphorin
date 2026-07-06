[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / verifyAuditConsistency

# Function: verifyAuditConsistency()

```ts
function verifyAuditConsistency(
   older, 
   newer, 
   proof): boolean;
```

Defined in: [packages/security/src/audit/merkle.ts:277](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/merkle.ts#L277)

Verify a consistency proof between two heads (RFC 6962 §2.1.2). A
`true` result means `newer` is an append-only extension of `older` -
nothing covered by `older` was rewritten, reordered, or truncated.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `older` | [`AuditTreeHead`](/api/@graphorin/security/interfaces/AuditTreeHead.md) |
| `newer` | [`AuditTreeHead`](/api/@graphorin/security/interfaces/AuditTreeHead.md) |
| `proof` | readonly `string`[] |

## Returns

`boolean`

## Stable
