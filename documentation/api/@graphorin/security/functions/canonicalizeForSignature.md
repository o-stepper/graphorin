[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / canonicalizeForSignature

# Function: canonicalizeForSignature()

```ts
function canonicalizeForSignature(skillMd): {
  bytes: Uint8Array;
  canonicalText: string;
};
```

Defined in: [packages/security/src/supply-chain/frontmatter.ts:159](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/frontmatter.ts#L159)

Compute the canonical bytes used for ed25519 signing / verification.
The algorithm:

1. Strip the `graphorin-signature` key from the frontmatter.
2. Recursively sort every object's keys.
3. Stringify back to YAML using `yaml`'s deterministic emitter.
4. Concatenate `frontmatter\n---\n<body>` and return the UTF-8 bytes.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `skillMd` | `string` |

## Returns

```ts
{
  bytes: Uint8Array;
  canonicalText: string;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `bytes` | `Uint8Array` | [packages/security/src/supply-chain/frontmatter.ts:160](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/frontmatter.ts#L160) |
| `canonicalText` | `string` | [packages/security/src/supply-chain/frontmatter.ts:161](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/frontmatter.ts#L161) |

## Stable
