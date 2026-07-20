[**Graphorin API reference v0.13.5**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [frontmatter](/api/@graphorin/skills/frontmatter/index.md) / parseAllowedToolsValue

# Function: parseAllowedToolsValue()

```ts
function parseAllowedToolsValue(value): readonly string[] | null;
```

Defined in: packages/skills/src/frontmatter/index.ts:437

**`Stable`**

Parse the `allowed-tools` field. Accepts either a string (with
whitespace-separated entries) or a string array. Returns `null` for
unsupported shapes so the validator can attach a typed diagnostic.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

## Returns

readonly `string`[] \| `null`
