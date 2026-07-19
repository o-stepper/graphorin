[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / extractSignatureBlock

# Function: extractSignatureBlock()

```ts
function extractSignatureBlock(frontmatter): 
  | SkillSignatureBlock
  | null;
```

Defined in: packages/security/src/supply-chain/frontmatter.ts:75

**`Stable`**

Extract a `graphorin-signature:` block from the parsed frontmatter.
Returns `null` when no signature block is present.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `frontmatter` | `Record`\&lt;`string`, `unknown`\&gt; |

## Returns

  \| [`SkillSignatureBlock`](/api/@graphorin/security/interfaces/SkillSignatureBlock.md)
  \| `null`
