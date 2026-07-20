[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SigstoreVerifier

# Type Alias: SigstoreVerifier

```ts
type SigstoreVerifier = (args, signal?) => Promise<{
  fingerprint: string;
  publicKeyPem: string;
}>;
```

Defined in: packages/security/src/supply-chain/signature.ts:51

**`Experimental`**

Strategy hook used by tests so the Sigstore branch can be exercised
without a real Fulcio + Rekor round-trip.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `identity`: `string`; `issuer`: `string`; `signature`: `string`; \} |
| `args.identity` | `string` |
| `args.issuer?` | `string` |
| `args.signature?` | `string` |
| `signal?` | `AbortSignal` |

## Returns

`Promise`\<\{
  `fingerprint`: `string`;
  `publicKeyPem`: `string`;
\}\>
