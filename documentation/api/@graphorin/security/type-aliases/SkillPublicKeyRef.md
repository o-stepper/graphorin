[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SkillPublicKeyRef

# Type Alias: SkillPublicKeyRef

```ts
type SkillPublicKeyRef = 
  | {
  kind: "well-known";
  pinFingerprint?: string;
  url: string;
}
  | {
  kind: "inline";
  publicKeyPem: string;
}
  | {
  identity: string;
  issuer: string;
  kind: "sigstore";
};
```

Defined in: [packages/security/src/supply-chain/types.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L54)

Discriminator for the public-key resolution strategy.

## Stable
