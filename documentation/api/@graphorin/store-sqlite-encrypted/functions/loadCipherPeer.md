[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / loadCipherPeer

# Function: loadCipherPeer()

```ts
function loadCipherPeer(): Promise<BetterSqlite3Constructor>;
```

Defined in: packages/store-sqlite-encrypted/src/cipher-peer.ts:39

Loads `better-sqlite3-multiple-ciphers`. The result is cached for
the lifetime of the process so repeat callers (encrypt + rekey +
connection-open in the same process) share one native handle.

## Returns

`Promise`\&lt;[`BetterSqlite3Constructor`](/api/@graphorin/store-sqlite/type-aliases/BetterSqlite3Constructor.md)\&gt;

## Stable
