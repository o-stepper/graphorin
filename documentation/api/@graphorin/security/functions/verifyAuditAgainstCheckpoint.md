[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / verifyAuditAgainstCheckpoint

# Function: verifyAuditAgainstCheckpoint()

```ts
function verifyAuditAgainstCheckpoint(
   db, 
   checkpoint, 
   opts): Promise<
  | {
  current: AuditTreeHead;
  ok: true;
}
  | {
  current?: AuditTreeHead;
  ok: false;
  reason: "bad-signature" | "inconsistent-log";
}>;
```

Defined in: [packages/security/src/audit/merkle.ts:432](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/merkle.ts#L432)

Full anchored verification: the checkpoint's signature is valid
against the pinned key AND the current log is an append-only
extension of the checkpointed head (consistency proof computed and
verified over the live database).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `db` | [`AuditDb`](/api/@graphorin/security/interfaces/AuditDb.md) |
| `checkpoint` | [`SignedAuditCheckpoint`](/api/@graphorin/security/interfaces/SignedAuditCheckpoint.md) |
| `opts` | \{ `publicKeyPem`: `string`; \} |
| `opts.publicKeyPem` | `string` |

## Returns

`Promise`\<
  \| \{
  `current`: [`AuditTreeHead`](/api/@graphorin/security/interfaces/AuditTreeHead.md);
  `ok`: `true`;
\}
  \| \{
  `current?`: [`AuditTreeHead`](/api/@graphorin/security/interfaces/AuditTreeHead.md);
  `ok`: `false`;
  `reason`: `"bad-signature"` \| `"inconsistent-log"`;
\}\>

## Stable
