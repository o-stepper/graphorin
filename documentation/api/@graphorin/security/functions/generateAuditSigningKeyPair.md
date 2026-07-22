[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / generateAuditSigningKeyPair

# Function: generateAuditSigningKeyPair()

```ts
function generateAuditSigningKeyPair(): {
  privateKeyPem: string;
  publicKeyPem: string;
};
```

Defined in: packages/security/src/audit/merkle.ts:361

**`Stable`**

Generate an Ed25519 keypair for audit-checkpoint signing (PEM SPKI /
PKCS8). Convenience for operators without existing key material.

## Returns

```ts
{
  privateKeyPem: string;
  publicKeyPem: string;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `privateKeyPem` | `string` | packages/security/src/audit/merkle.ts:363 |
| `publicKeyPem` | `string` | packages/security/src/audit/merkle.ts:362 |
