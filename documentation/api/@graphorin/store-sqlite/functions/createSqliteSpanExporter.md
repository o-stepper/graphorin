[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / createSqliteSpanExporter

# Function: createSqliteSpanExporter()

```ts
function createSqliteSpanExporter(conn, options?): TraceExporter;
```

Defined in: [packages/store-sqlite/src/span-store.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/span-store.ts#L53)

Build a `TraceExporter` that persists finished spans into the `spans` table.
Each row records the `graphorin.session.id` attribute (when present) so a
session's spans can be read back in order.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |
| `options` | \{ `id?`: `string`; \} |
| `options.id?` | `string` |

## Returns

[`TraceExporter`](/api/@graphorin/observability/interfaces/TraceExporter.md)

## Stable
