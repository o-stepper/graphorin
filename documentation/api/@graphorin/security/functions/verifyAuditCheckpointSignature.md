[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / verifyAuditCheckpointSignature

# Function: verifyAuditCheckpointSignature()

```ts
function verifyAuditCheckpointSignature(checkpoint, publicKeyPem): boolean;
```

Defined in: packages/security/src/audit/merkle.ts:408

**`Stable`**

Verify a signed checkpoint's Ed25519 signature against a pinned
public key (pure - no database access).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `checkpoint` | [`SignedAuditCheckpoint`](/api/@graphorin/security/interfaces/SignedAuditCheckpoint.md) |
| `publicKeyPem` | `string` |

## Returns

`boolean`
