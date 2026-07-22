[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / NextBatchHook

# Type Alias: NextBatchHook

```ts
type NextBatchHook = (args) => Promise<{
  nextCursor: string | null;
  rows: ReadonlyArray<MigrationRow>;
}>;
```

Defined in: packages/memory/src/migration/embedder-migration.ts:137

**`Stable`**

Per-batch loader. Returns up to `batchSize` rows for the supplied
`kind` whose `embedder_id` is the source embedder. Returning an
empty array signals end-of-stream.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `batchSize`: `number`; `cursor`: `string` \| `null`; `kind`: `"fact"` \| `"episode"` \| `"message"`; `source`: `string`; `target`: `string`; \} |
| `args.batchSize` | `number` |
| `args.cursor` | `string` \| `null` |
| `args.kind` | `"fact"` \| `"episode"` \| `"message"` |
| `args.source` | `string` |
| `args.target` | `string` |

## Returns

`Promise`\<\{
  `nextCursor`: `string` \| `null`;
  `rows`: `ReadonlyArray`\&lt;[`MigrationRow`](/api/@graphorin/memory/interfaces/MigrationRow.md)\&gt;;
\}\>
