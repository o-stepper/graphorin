[**Graphorin API reference v0.13.10**](../../../index.md)

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

Defined in: packages/security/src/supply-chain/types.ts:54

**`Stable`**

Discriminator for the public-key resolution strategy.
