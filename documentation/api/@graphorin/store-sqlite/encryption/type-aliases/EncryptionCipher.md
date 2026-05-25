[**Graphorin API reference v0.4.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [encryption](/api/@graphorin/store-sqlite/encryption/index.md) / EncryptionCipher

# Type Alias: EncryptionCipher

```ts
type EncryptionCipher = "sqlcipher" | "wxsqlite3" | "aes256cbc" | "aes128cbc" | "rc4";
```

Defined in: packages/store-sqlite/src/encryption/index.ts:26

Cipher selection. The default `'sqlcipher'` mirrors the most-shipped
variant of `better-sqlite3-multiple-ciphers`. Other variants
(`'wxsqlite3'`, `'rc4'`, …) are accepted by the cipher peer; we
validate the string only at the resolver boundary.

## Stable
