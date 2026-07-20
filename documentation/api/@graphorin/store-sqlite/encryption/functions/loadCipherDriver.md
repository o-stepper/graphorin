[**Graphorin API reference v0.13.4**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [encryption](/api/@graphorin/store-sqlite/encryption/index.md) / loadCipherDriver

# Function: loadCipherDriver()

```ts
function loadCipherDriver(): Promise<BetterSqlite3Constructor>;
```

Defined in: packages/store-sqlite/src/encryption/index.ts:105

**`Stable`**

Loads the cipher peer (`better-sqlite3-multiple-ciphers`). Lazy by
design - the import only fires when encryption-at-rest is enabled.

## Returns

`Promise`\&lt;[`BetterSqlite3Constructor`](/api/@graphorin/store-sqlite/type-aliases/BetterSqlite3Constructor.md)\&gt;
