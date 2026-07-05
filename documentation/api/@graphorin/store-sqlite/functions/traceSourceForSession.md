[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / traceSourceForSession

# Function: traceSourceForSession()

```ts
function traceSourceForSession(conn, sessionId): AsyncIterable<SpanRecord<SpanType>>;
```

Defined in: packages/store-sqlite/src/span-store.ts:100

Read a session's persisted spans back as an ordered
`AsyncIterable<SpanRecord>` - the `traceSource` shape `Session.replay()` and
the `graphorin memory why` CLI consume. Spans are ordered by start time
(then span id) so replay reproduces the original run order.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |
| `sessionId` | `string` |

## Returns

`AsyncIterable`\<[`SpanRecord`](/api/@graphorin/observability/interfaces/SpanRecord.md)\&lt;[`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md)\&gt;\>

## Stable
