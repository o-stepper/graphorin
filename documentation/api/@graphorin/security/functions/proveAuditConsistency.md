[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / proveAuditConsistency

# Function: proveAuditConsistency()

```ts
function proveAuditConsistency(
   db, 
   older, 
newer): Promise<readonly string[]>;
```

Defined in: [packages/security/src/audit/merkle.ts:250](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/merkle.ts#L250)

Produce an RFC-6962 consistency proof that the log at `older.size`
is a prefix of the log at `newer.size`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `db` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) |
| `older` | [`AuditTreeHead`](/api/@graphorin/security/interfaces/AuditTreeHead.md) |
| `newer` | [`AuditTreeHead`](/api/@graphorin/security/interfaces/AuditTreeHead.md) |

## Returns

`Promise`\&lt;readonly `string`[]\&gt;

## Stable
