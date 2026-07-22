[**Graphorin API reference v0.15.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [encryption](/api/@graphorin/store-sqlite/encryption/index.md) / cipherSelectionPragmas

# Function: cipherSelectionPragmas()

```ts
function cipherSelectionPragmas(cipher): readonly string[];
```

Defined in: packages/store-sqlite/src/encryption/index.ts:38

**`Stable`**

The cipher-selection PRAGMAs that must run **before** `PRAGMA key`
on a freshly opened connection. sqlite3mc defaults to
`chacha20`, so opening a SQLCipher-v4 database with `key` alone
reads garbage - every keyed open must pin the cipher first.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `cipher` | [`EncryptionCipher`](/api/@graphorin/store-sqlite/encryption/type-aliases/EncryptionCipher.md) |

## Returns

readonly `string`[]
