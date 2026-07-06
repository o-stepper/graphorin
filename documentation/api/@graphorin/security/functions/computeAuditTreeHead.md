[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / computeAuditTreeHead

# Function: computeAuditTreeHead()

```ts
function computeAuditTreeHead(db, opts?): Promise<AuditTreeHead>;
```

Defined in: [packages/security/src/audit/merkle.ts:142](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/merkle.ts#L142)

Compute the current (or historical, via `toSeq`) Merkle tree head of
the audit log.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `db` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) |
| `opts` | \{ `toSeq?`: `number`; \} |
| `opts.toSeq?` | `number` |

## Returns

`Promise`\&lt;[`AuditTreeHead`](/api/@graphorin/security/interfaces/AuditTreeHead.md)\&gt;

## Stable
