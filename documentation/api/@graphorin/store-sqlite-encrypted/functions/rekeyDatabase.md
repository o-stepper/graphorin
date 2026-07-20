[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / rekeyDatabase

# Function: rekeyDatabase()

```ts
function rekeyDatabase(options): Promise<RekeyDatabaseResult>;
```

Defined in: packages/store-sqlite-encrypted/src/rekey.ts:61

**`Stable`**

Re-keys an encrypted SQLite database. Throws if the file is missing,
the cipher peer cannot be loaded, the old passphrase is wrong (the
cipher peer raises `SQLITE_NOTADB` on the first read), or the
post-rekey integrity check fails.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`RekeyDatabaseOptions`](/api/@graphorin/store-sqlite-encrypted/interfaces/RekeyDatabaseOptions.md) |

## Returns

`Promise`\&lt;[`RekeyDatabaseResult`](/api/@graphorin/store-sqlite-encrypted/interfaces/RekeyDatabaseResult.md)\&gt;
