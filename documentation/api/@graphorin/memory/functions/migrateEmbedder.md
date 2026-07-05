[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / migrateEmbedder

# Function: migrateEmbedder()

```ts
function migrateEmbedder(options): AsyncGenerator<MigrationProgress, void, unknown>;
```

Defined in: packages/memory/src/migration/embedder-migration.ts:127

Stream embedder migrations as `AsyncIterable<MigrationProgress>`.

The function is the universal entry point for every migration
strategy:

 - `'lock-on-first'`: surfaces the locked error eagerly so the
   operator can act before any work happens.
 - `'multi-active'`: registers the target alongside the source and
   yields a single `'committed'` progress event.
 - `'auto-migrate'`: streams batches until the source is fully
   drained, then retires the source row.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`MigrateEmbedderOptions`](/api/@graphorin/memory/interfaces/MigrateEmbedderOptions.md) |

## Returns

`AsyncGenerator`\&lt;[`MigrationProgress`](/api/@graphorin/memory/interfaces/MigrationProgress.md), `void`, `unknown`\&gt;

## Stable
