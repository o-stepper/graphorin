[**Graphorin API reference v0.13.6**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [frontmatter](/api/@graphorin/skills/frontmatter/index.md) / parseHandoffInputFilter

# Function: parseHandoffInputFilter()

```ts
function parseHandoffInputFilter(value): 
  | HandoffInputFilterDeclaration
  | null;
```

Defined in: packages/skills/src/frontmatter/index.ts:463

**`Stable`**

Parse the `handoff-input-filter` field into a structured
declaration. Returns `null` for unsupported shapes; callers should
attach a diagnostic when the return value is `null` and the source
value was non-undefined.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

## Returns

  \| [`HandoffInputFilterDeclaration`](/api/@graphorin/skills/type-aliases/HandoffInputFilterDeclaration.md)
  \| `null`
