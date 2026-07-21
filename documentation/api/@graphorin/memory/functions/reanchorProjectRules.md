[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / reanchorProjectRules

# Function: reanchorProjectRules()

```ts
function reanchorProjectRules(options?): NamedPostCompactionHook;
```

Defined in: packages/memory/src/context-engine/compaction/hooks/reanchor-project-rules.ts:18

**`Stable`**

Build a `reanchorProjectRules` hook.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `ruleTagsAllowlist?`: readonly `string`[]; \} |
| `options.ruleTagsAllowlist?` | readonly `string`[] |

## Returns

[`NamedPostCompactionHook`](/api/@graphorin/memory/interfaces/NamedPostCompactionHook.md)
