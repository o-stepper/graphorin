[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / \_setCipherPeerForTesting

# Function: \_setCipherPeerForTesting()

```ts
function _setCipherPeerForTesting(ctor): void;
```

Defined in: packages/store-sqlite-encrypted/src/cipher-peer.ts:75

**`Internal`**

Test-only escape hatch. Pre-populates the cache with a stub driver
so unit tests can exercise the encrypt / rekey runners without
touching the native cipher addon.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ctor` | [`BetterSqlite3Constructor`](/api/@graphorin/store-sqlite/type-aliases/BetterSqlite3Constructor.md) |

## Returns

`void`
