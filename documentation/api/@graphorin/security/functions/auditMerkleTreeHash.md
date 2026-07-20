[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / auditMerkleTreeHash

# Function: auditMerkleTreeHash()

```ts
function auditMerkleTreeHash(leaves): Buffer;
```

Defined in: packages/security/src/audit/merkle.ts:60

RFC 6962 §2.1 Merkle Tree Hash over ordered leaf hashes. The empty
tree hashes to `SHA-256()` per the RFC.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `leaves` | readonly `Buffer`\&lt;`ArrayBufferLike`\&gt;[] |

## Returns

`Buffer`
