[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / EncryptionCipher

# Type Alias: EncryptionCipher

```ts
type EncryptionCipher = "sqlcipher" | "wxsqlite3" | "aes256cbc" | "aes128cbc" | "rc4";
```

Defined in: packages/store-sqlite/dist/encryption/index.d.ts:13

Cipher selection. The default `'sqlcipher'` mirrors the most-shipped
variant of `better-sqlite3-multiple-ciphers`. Other variants
(`'wxsqlite3'`, `'rc4'`, …) are accepted by the cipher peer; we
validate the string only at the resolver boundary.

## Stable
