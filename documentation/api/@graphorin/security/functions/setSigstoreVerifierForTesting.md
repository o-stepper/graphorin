[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / \_setSigstoreVerifierForTesting

# Function: \_setSigstoreVerifierForTesting()

```ts
function _setSigstoreVerifierForTesting(verifier): void;
```

Defined in: packages/security/src/supply-chain/signature.ts:64

**`Experimental`**

Override the Sigstore verifier. Sigstore support is opt-in; the
framework keeps the surface dormant until a verifier is installed.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `verifier` | \| [`SigstoreVerifier`](/api/@graphorin/security/type-aliases/SigstoreVerifier.md) \| `null` |

## Returns

`void`
