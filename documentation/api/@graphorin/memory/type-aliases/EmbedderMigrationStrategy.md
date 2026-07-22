[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / EmbedderMigrationStrategy

# Type Alias: EmbedderMigrationStrategy

```ts
type EmbedderMigrationStrategy = "lock-on-first" | "multi-active" | "auto-migrate";
```

Defined in: packages/memory/src/migration/embedder-migration.ts:23

**`Stable`**

Coexistence policy for embedder swaps.

 - `'lock-on-first'` (default) - refuses to register a second active
   embedder; surfaces an actionable error pointing at the planned
   migration runner.
 - `'multi-active'` - keeps both embedders alive (read union, write
   to active); used while a long migration is in flight.
 - `'auto-migrate'` - re-embeds existing rows in resumable batches
   until the source embedder has zero rows, then retires it.
