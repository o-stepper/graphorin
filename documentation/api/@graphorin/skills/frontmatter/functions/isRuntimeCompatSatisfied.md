[**Graphorin API reference v0.13.10**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [frontmatter](/api/@graphorin/skills/frontmatter/index.md) / isRuntimeCompatSatisfied

# Function: isRuntimeCompatSatisfied()

```ts
function isRuntimeCompatSatisfied(range, version): boolean;
```

Defined in: packages/skills/src/frontmatter/index.ts:567

**`Stable`**

Best-effort semver-range satisfaction check. Supports the patterns
the framework actually emits (`^x.y.z`, `~x.y.z`, `>=x.y.z`,
`>x.y.z`, `<=x.y.z`, `<x.y.z`, plain `x.y.z`, the AND combinator
with whitespace) without pulling a runtime dependency on `semver`.
Unrecognised inputs return `false` so the validator emits a typed
diagnostic.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `range` | `string` |
| `version` | `string` |

## Returns

`boolean`
