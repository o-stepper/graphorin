[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / extractSignatureBlock

# Function: extractSignatureBlock()

```ts
function extractSignatureBlock(frontmatter): 
  | SkillSignatureBlock
  | null;
```

Defined in: [packages/security/src/supply-chain/frontmatter.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/frontmatter.ts#L75)

Extract a `graphorin-signature:` block from the parsed frontmatter.
Returns `null` when no signature block is present.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `frontmatter` | `Record`\&lt;`string`, `unknown`\&gt; |

## Returns

  \| [`SkillSignatureBlock`](/api/@graphorin/security/interfaces/SkillSignatureBlock.md)
  \| `null`

## Stable
