[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / EmbedderPolicy

# Type Alias: EmbedderPolicy

```ts
type EmbedderPolicy = "lock-on-first" | "multi-active" | "auto-migrate";
```

Defined in: packages/store-sqlite/src/embedding-meta-repo.ts:77

**`Stable`**

Multi-embedder coexistence policy. `'lock-on-first'` is the default -
the first registered embedder is the only writer; subsequent
different embedders must run a migration. `'multi-active'` allows
coexistence (read both, write to default). `'auto-migrate'` is a
Phase 16 hook (off in v0.1).
