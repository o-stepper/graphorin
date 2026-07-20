[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorTier

# Type Alias: ConsolidatorTier

```ts
type ConsolidatorTier = "free" | "cheap" | "standard" | "full" | "custom";
```

Defined in: packages/memory/src/consolidator/types.ts:80

**`Stable`**

Tier preset that selects a consolidator behaviour bundle. The
`'free'` preset is the default per DEC-144 / ADR-038 - no LLM call
fires until the operator opts in.
