[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / signAuditCheckpoint

# Function: signAuditCheckpoint()

```ts
function signAuditCheckpoint(db, opts): Promise<SignedAuditCheckpoint>;
```

Defined in: [packages/security/src/audit/merkle.ts:377](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/merkle.ts#L377)

Compute and sign the current tree head.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `db` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) | - |
| `opts` | \{ `now?`: () => `number`; `privateKeyPem`: `string`; `writerId`: `string`; \} | - |
| `opts.now?` | () => `number` | Override the wall clock - used by tests. |
| `opts.privateKeyPem` | `string` | - |
| `opts.writerId` | `string` | - |

## Returns

`Promise`\&lt;[`SignedAuditCheckpoint`](/api/@graphorin/security/interfaces/SignedAuditCheckpoint.md)\&gt;

## Stable
