[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EntityResolveDecision

# Type Alias: EntityResolveDecision

```ts
type EntityResolveDecision = 
  | {
  entityId: string;
  kind: "match";
  similarity: number;
  via: "lexical" | "embedding";
}
  | {
  entityId: string;
  kind: "ambiguous";
  similarity: number;
}
  | {
  kind: "new";
};
```

Defined in: packages/memory/src/graph/entity-resolver.ts:47

**`Stable`**

Outcome of the pure resolution policy. `match` reuses an existing
entity; `ambiguous` flags a middle-similarity candidate for the caller
to adjudicate (or conservatively reject); `new` mints a fresh entity.
