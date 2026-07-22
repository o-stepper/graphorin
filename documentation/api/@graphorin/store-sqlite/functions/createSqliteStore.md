[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / createSqliteStore

# Function: createSqliteStore()

```ts
function createSqliteStore(options): Promise<GraphorinSqliteStore>;
```

Defined in: packages/store-sqlite/src/index.ts:265

**`Stable`**

Open a SQLite-backed Graphorin store. The returned object exposes
every contract implementation; call `init()` once before first use.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateSqliteStoreOptions`](/api/@graphorin/store-sqlite/interfaces/CreateSqliteStoreOptions.md) |

## Returns

`Promise`\&lt;[`GraphorinSqliteStore`](/api/@graphorin/store-sqlite/interfaces/GraphorinSqliteStore.md)\&gt;
