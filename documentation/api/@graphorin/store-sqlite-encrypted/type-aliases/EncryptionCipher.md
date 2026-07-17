[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / EncryptionCipher

# Type Alias: EncryptionCipher

```ts
type EncryptionCipher = "sqlcipher" | "chacha20" | "aes256cbc" | "aes128cbc" | "rc4";
```

Defined in: [packages/store-sqlite/dist/encryption/index.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/dist/encryption/index.d.ts)

Cipher selection, validated against the real sqlite3mc vocabulary
(CS-13 - `'wxsqlite3'` is the library's name, not a cipher; the peer
rejects it with "Cipher 'wxsqlite3' unknown"). `'sqlcipher'` is the
Graphorin default (SQLCipher v4 compatible); `'chacha20'` is the
peer's own default cipher.

## Stable
