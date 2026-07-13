[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / verifyAuditCheckpointSignature

# Function: verifyAuditCheckpointSignature()

```ts
function verifyAuditCheckpointSignature(checkpoint, publicKeyPem): boolean;
```

Defined in: [packages/security/src/audit/merkle.ts:408](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/merkle.ts#L408)

Verify a signed checkpoint's Ed25519 signature against a pinned
public key (pure - no database access).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `checkpoint` | [`SignedAuditCheckpoint`](/api/@graphorin/security/interfaces/SignedAuditCheckpoint.md) |
| `publicKeyPem` | `string` |

## Returns

`boolean`

## Stable
