[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / updateLazyLoadedSet

# Function: updateLazyLoadedSet()

```ts
function updateLazyLoadedSet(current, events?): readonly LazyLoadedToolEntry[];
```

Defined in: packages/memory/src/context-engine/tool-budget/allocator.ts:215

Update the lazy-loaded set after a step. The caller threads the
returned snapshot through their own bookkeeping (Phase 12 owns
the lifecycle in production; tests use this directly).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `current` | readonly [`LazyLoadedToolEntry`](/api/@graphorin/memory/interfaces/LazyLoadedToolEntry.md)[] |
| `events` | \{ `added?`: readonly `string`[]; `evicted?`: readonly `string`[]; `invoked?`: readonly `string`[]; `now?`: () => `number`; \} |
| `events.added?` | readonly `string`[] |
| `events.evicted?` | readonly `string`[] |
| `events.invoked?` | readonly `string`[] |
| `events.now?` | () => `number` |

## Returns

readonly [`LazyLoadedToolEntry`](/api/@graphorin/memory/interfaces/LazyLoadedToolEntry.md)[]

## Stable
