[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ContextualRetrievalMode

# Type Alias: ContextualRetrievalMode

```ts
type ContextualRetrievalMode = "off" | "late-chunk" | "llm";
```

Defined in: [packages/memory/src/internal/contextualize.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/internal/contextualize.ts#L31)

Contextual-retrieval mode. `'late-chunk'` is the offline default;
`'llm'` is the opt-in, consolidator-only enrichment. P1-3.

## Stable
