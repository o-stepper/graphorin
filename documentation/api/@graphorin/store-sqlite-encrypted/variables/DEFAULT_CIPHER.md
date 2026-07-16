[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / DEFAULT\_CIPHER

# Variable: DEFAULT\_CIPHER

```ts
const DEFAULT_CIPHER: EncryptionCipher = 'sqlcipher';
```

Defined in: [packages/store-sqlite-encrypted/src/cipher-config.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite-encrypted/src/cipher-config.ts#L20)

Default cipher. Matches ADR-030 § 2 - SQLCipher v4 compatible
(AES-256-CBC + HMAC-SHA1, `legacy=4` parameter set).

## Stable
