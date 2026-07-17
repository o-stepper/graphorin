[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / verifySkillSignature

# Function: verifySkillSignature()

```ts
function verifySkillSignature(options): Promise<SkillSignatureVerificationResult>;
```

Defined in: [packages/security/src/supply-chain/signature.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/signature.ts#L107)

Verify the ed25519 signature embedded in `skillMd`. Returns a
structured result instead of throwing for the validation outcome -
callers branch on `valid`. Parser-level errors (missing block,
malformed YAML) are still thrown via the supply-chain error
hierarchy.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`VerifySkillSignatureOptions`](/api/@graphorin/security/interfaces/VerifySkillSignatureOptions.md) |

## Returns

`Promise`\&lt;[`SkillSignatureVerificationResult`](/api/@graphorin/security/interfaces/SkillSignatureVerificationResult.md)\&gt;

## Stable
