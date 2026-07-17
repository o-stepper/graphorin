[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / reanchorProjectRules

# Function: reanchorProjectRules()

```ts
function reanchorProjectRules(options?): NamedPostCompactionHook;
```

Defined in: [packages/memory/src/context-engine/compaction/hooks/reanchor-project-rules.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/hooks/reanchor-project-rules.ts#L18)

Build a `reanchorProjectRules` hook.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `ruleTagsAllowlist?`: readonly `string`[]; \} |
| `options.ruleTagsAllowlist?` | readonly `string`[] |

## Returns

[`NamedPostCompactionHook`](/api/@graphorin/memory/interfaces/NamedPostCompactionHook.md)

## Stable
