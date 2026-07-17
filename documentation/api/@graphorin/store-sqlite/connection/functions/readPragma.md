[**Graphorin API reference v0.10.2**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [connection](/api/@graphorin/store-sqlite/connection/index.md) / readPragma

# Function: readPragma()

```ts
function readPragma(conn, name): unknown;
```

Defined in: [packages/store-sqlite/src/connection.ts:388](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/connection.ts#L388)

Pragma helper that surfaces the runtime value of a single setting as
a typed scalar. Used by the integration tests to verify the WAL
hardening defaults landed correctly.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |
| `name` | `string` |

## Returns

`unknown`

## Stable
