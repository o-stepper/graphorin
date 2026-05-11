[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemoryKind

# Type Alias: MemoryKind

```ts
type MemoryKind = "working" | "session" | "episodic" | "semantic" | "procedural" | "shared";
```

Defined in: packages/core/src/types/memory.ts:10

The six tiers of the Graphorin memory model. Used as the discriminator
for `MemoryStore` sub-namespaces, span types, and the `MemoryRecord`
union.

## Stable
