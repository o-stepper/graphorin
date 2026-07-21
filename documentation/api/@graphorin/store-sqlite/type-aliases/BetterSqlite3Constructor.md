[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / BetterSqlite3Constructor

# Type Alias: BetterSqlite3Constructor

```ts
type BetterSqlite3Constructor = (filename, options?) => BetterSqlite3Database;
```

Defined in: packages/store-sqlite/src/driver-types.ts:70

**`Internal`**

Constructor signature exposed by both `better-sqlite3` and
`better-sqlite3-multiple-ciphers` (the cipher peer is a drop-in
replacement of the default driver).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `filename` | `string` |
| `options?` | \{ `fileMustExist?`: `boolean`; `readonly?`: `boolean`; `timeout?`: `number`; \} |
| `options.fileMustExist?` | `boolean` |
| `options.readonly?` | `boolean` |
| `options.timeout?` | `number` |

## Returns

[`BetterSqlite3Database`](/api/@graphorin/store-sqlite/connection/interfaces/BetterSqlite3Database.md)
