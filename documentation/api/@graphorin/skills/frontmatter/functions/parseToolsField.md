[**Graphorin API reference v0.13.2**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [frontmatter](/api/@graphorin/skills/frontmatter/index.md) / parseToolsField

# Function: parseToolsField()

```ts
function parseToolsField(value): 
  | readonly SkillToolDeclaration[]
  | null;
```

Defined in: packages/skills/src/frontmatter/index.ts:530

**`Stable`**

Parse the `tools` field. Accepts either an array of strings (tool
names - the loader resolves modules through naming convention) or
an array of objects with `name`, `module`, `description`, `tags`.
Returns `null` for unsupported shapes.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

## Returns

  \| readonly [`SkillToolDeclaration`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md)[]
  \| `null`
