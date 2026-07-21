[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / pruneSpans

# Function: pruneSpans()

```ts
function pruneSpans(conn, opts): number;
```

Defined in: packages/store-sqlite/src/span-store.ts:137

**`Stable`**

Age-based span retention: delete every span that FINISHED
before the cutoff, including rows with `session_id IS NULL` (not
attached to any session, so age is their only deletion path). The
cutoff is epoch **milliseconds** - the ns conversion happens here so
callers never juggle units; sub-ms precision loss at the 2^53
boundary is irrelevant for retention. Backed by the
`idx_spans_end` index (migration 030), so the sweep is not a full
table scan. Returns the number of rows deleted.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |
| `opts` | \{ `beforeEpochMs`: `number`; \} |
| `opts.beforeEpochMs` | `number` |

## Returns

`number`
