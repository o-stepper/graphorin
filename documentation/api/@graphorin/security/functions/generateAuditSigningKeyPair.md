[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / generateAuditSigningKeyPair

# Function: generateAuditSigningKeyPair()

```ts
function generateAuditSigningKeyPair(): {
  privateKeyPem: string;
  publicKeyPem: string;
};
```

Defined in: [packages/security/src/audit/merkle.ts:361](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/merkle.ts#L361)

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
| `privateKeyPem` | `string` | [packages/security/src/audit/merkle.ts:363](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/merkle.ts#L363) |
| `publicKeyPem` | `string` | [packages/security/src/audit/merkle.ts:362](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/merkle.ts#L362) |

## Stable
