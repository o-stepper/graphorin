[**Graphorin API reference v0.13.13**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [encryption](/api/@graphorin/store-sqlite/encryption/index.md) / EncryptionCipher

# Type Alias: EncryptionCipher

```ts
type EncryptionCipher = "sqlcipher" | "chacha20" | "aes256cbc" | "aes128cbc" | "rc4";
```

Defined in: packages/store-sqlite/src/encryption/index.ts:28

**`Stable`**

Cipher selection, validated against the real sqlite3mc vocabulary
(`'wxsqlite3'` is the library's name, not a cipher; the peer
rejects it with "Cipher 'wxsqlite3' unknown"). `'sqlcipher'` is the
Graphorin default (SQLCipher v4 compatible); `'chacha20'` is the
peer's own default cipher.
