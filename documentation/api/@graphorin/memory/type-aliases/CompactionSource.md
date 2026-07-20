[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CompactionSource

# Type Alias: CompactionSource

```ts
type CompactionSource = "auto-trigger" | "manual" | "pre-step";
```

Defined in: packages/memory/src/context-engine/compaction/types.ts:17

**`Stable`**

Source classification for a compaction event. Surfaced on the
`context.compacted` agent event AND on the
`context.compaction.triggered.total{source}` counter.
