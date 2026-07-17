[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ReconcileAction

# Type Alias: ReconcileAction

```ts
type ReconcileAction = "add" | "update" | "noop" | "conflict";
```

Defined in: [packages/memory/src/conflict/types.ts:232](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/types.ts#L232)

The four actions the neighbour-aware reconcile loop (P0-3) may choose
for a candidate fact once the LLM has the most-similar existing
memories in view. The de-facto-standard memory write loop
(Mem0 / LangMem / Letta), with Graphorin's twist: `update` and
`conflict` route through a **bi-temporal supersede** (close the old
interval, insert the new) rather than a destructive delete.

## Stable
