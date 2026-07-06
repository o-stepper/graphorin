[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [frontmatter](/api/@graphorin/skills/frontmatter/index.md) / resolveSkillField

# Function: resolveSkillField()

```ts
function resolveSkillField<T>(
   frontmatter, 
   field, 
fallback?): FieldResolution<T>;
```

Defined in: packages/skills/src/frontmatter/index.ts:93

Resolve a single field across the four field-resolution tiers.
Returns the resolved value plus the source tier the value came from
AND the list of conflicting source names so the validator can
surface a structured diagnostic.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `frontmatter` | `Record`\&lt;`string`, `unknown`\&gt; |
| `field` | `string` |
| `fallback?` | `T` |

## Returns

[`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`T`\&gt;

## Stable
