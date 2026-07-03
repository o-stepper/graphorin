[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / \_resetCipherPeerCacheForTesting

# Function: \_resetCipherPeerCacheForTesting()

```ts
function _resetCipherPeerCacheForTesting(): void;
```

Defined in: packages/store-sqlite-encrypted/src/cipher-peer.ts:64

**`Internal`**

Test-only escape hatch. Drops the cached constructor so the next
[loadCipherPeer](/api/@graphorin/store-sqlite-encrypted/functions/loadCipherPeer.md) call re-imports the peer.

## Returns

`void`
