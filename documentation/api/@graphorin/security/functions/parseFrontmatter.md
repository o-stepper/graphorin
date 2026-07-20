[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / parseFrontmatter

# Function: parseFrontmatter()

```ts
function parseFrontmatter(frontmatter): Record<string, unknown>;
```

Defined in: packages/security/src/supply-chain/frontmatter.ts:52

**`Stable`**

Parse the YAML frontmatter into a plain object. Returns `{}` for an
empty block.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `frontmatter` | `string` |

## Returns

`Record`\&lt;`string`, `unknown`\&gt;
