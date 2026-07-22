[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / reanchorPinnedFacts

# Function: reanchorPinnedFacts()

```ts
function reanchorPinnedFacts(options): NamedPostCompactionHook;
```

Defined in: packages/memory/src/context-engine/compaction/hooks/reanchor-pinned-facts.ts:19

**`Stable`**

Build a `reanchorPinnedFacts` hook.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `maxTokens?`: `number`; `pinnedFactIds`: readonly `string`[]; `tokenCounter?`: [`ContextTokenCounter`](/api/@graphorin/memory/interfaces/ContextTokenCounter.md); \} |
| `options.maxTokens?` | `number` |
| `options.pinnedFactIds` | readonly `string`[] |
| `options.tokenCounter?` | [`ContextTokenCounter`](/api/@graphorin/memory/interfaces/ContextTokenCounter.md) |

## Returns

[`NamedPostCompactionHook`](/api/@graphorin/memory/interfaces/NamedPostCompactionHook.md)
