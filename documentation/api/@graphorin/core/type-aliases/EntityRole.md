[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / EntityRole

# Type Alias: EntityRole

```ts
type EntityRole = "subject" | "object";
```

Defined in: [packages/core/src/types/memory.ts:329](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L329)

Role a [GraphEntity](/api/@graphorin/core/interfaces/GraphEntity.md) plays in a [Fact](/api/@graphorin/core/interfaces/Fact.md)'s s/p/o triple
(P2-1) - the `subject` or the `object`. The `predicate` is a relation
label, not an entity, so it has no role here.

## Stable
