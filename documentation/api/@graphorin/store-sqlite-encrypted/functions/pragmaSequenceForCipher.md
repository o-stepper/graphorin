[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / pragmaSequenceForCipher

# Function: pragmaSequenceForCipher()

```ts
function pragmaSequenceForCipher(cipher): readonly string[];
```

Defined in: packages/store-sqlite-encrypted/src/cipher-config.ts:44

**`Stable`**

Returns the PRAGMA statements that select a cipher. The list is
applied **before** `PRAGMA key = ...` so the cipher peer knows which
KDF / mode to use when interpreting the key bytes.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `cipher` | [`EncryptionCipher`](/api/@graphorin/store-sqlite-encrypted/type-aliases/EncryptionCipher.md) |

## Returns

readonly `string`[]
