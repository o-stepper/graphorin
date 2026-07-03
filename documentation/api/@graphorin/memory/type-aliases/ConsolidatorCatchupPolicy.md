[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ConsolidatorCatchupPolicy

# Type Alias: ConsolidatorCatchupPolicy

```ts
type ConsolidatorCatchupPolicy = "none" | "last" | "all";
```

Defined in: packages/memory/src/consolidator/scheduler.ts:28

Catch-up policy applied when a trigger missed one or more fires
while the scheduler was offline. Mirrors
`@graphorin/triggers`'s `CatchupPolicy` — duplicated here so the
memory package stays import-free at the type level.

## Stable
