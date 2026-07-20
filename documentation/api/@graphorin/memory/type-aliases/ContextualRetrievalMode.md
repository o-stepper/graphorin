[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ContextualRetrievalMode

# Type Alias: ContextualRetrievalMode

```ts
type ContextualRetrievalMode = "off" | "late-chunk" | "llm";
```

Defined in: packages/memory/src/internal/contextualize.ts:31

**`Stable`**

Contextual-retrieval mode. `'late-chunk'` is the offline default;
`'llm'` is the opt-in, consolidator-only enrichment.
