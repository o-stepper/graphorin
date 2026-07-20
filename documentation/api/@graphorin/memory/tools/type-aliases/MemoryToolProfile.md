[**Graphorin API reference v0.13.4**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [tools](/api/@graphorin/memory/tools/index.md) / MemoryToolProfile

# Type Alias: MemoryToolProfile

```ts
type MemoryToolProfile = "interactive" | "reviser" | "full";
```

Defined in: packages/memory/src/tools/index.ts:102

**`Stable`**

Memory tool profile: which slice of the canonical set an
agent receives. `'interactive'` is read-only by construction.
