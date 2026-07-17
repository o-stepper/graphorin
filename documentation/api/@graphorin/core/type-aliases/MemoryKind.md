[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemoryKind

# Type Alias: MemoryKind

```ts
type MemoryKind = 
  | "working"
  | "session"
  | "episodic"
  | "semantic"
  | "procedural"
  | "shared"
  | "insight";
```

Defined in: [packages/core/src/types/memory.ts:13](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L13)

Kinds of memory record in the Graphorin model. The first six are the
storage tiers the [MemoryStore](/api/@graphorin/core/interfaces/MemoryStore.md) contract exposes as 1:1
sub-namespaces; `insight` is the derived, reflection-synthesized
record kind (P1-1) - it has no base-tier namespace and is persisted
through the optional insight surface adapters expose. Used as the
discriminator for span types and the `MemoryRecord` union.

## Stable
