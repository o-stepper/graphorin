[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / EntityRole

# Type Alias: EntityRole

```ts
type EntityRole = "subject" | "object";
```

Defined in: packages/core/src/types/memory.ts:329

**`Stable`**

Role a [GraphEntity](/api/@graphorin/core/interfaces/GraphEntity.md) plays in a [Fact](/api/@graphorin/core/interfaces/Fact.md)'s s/p/o triple
- the `subject` or the `object`. The `predicate` is a relation
label, not an entity, so it has no role here.
