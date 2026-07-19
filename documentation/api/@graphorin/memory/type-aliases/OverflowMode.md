[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / OverflowMode

# Type Alias: OverflowMode

```ts
type OverflowMode = "truncate" | "drop";
```

Defined in: packages/memory/src/context-engine/token-budget.ts:79

**`Stable`**

Per-layer truncation mode used when the layer overflows its cap
or the global budget. `truncate` is the default; `drop` removes
the layer entirely when it would otherwise overflow.
