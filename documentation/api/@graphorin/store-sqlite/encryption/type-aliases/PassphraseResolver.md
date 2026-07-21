[**Graphorin API reference v0.13.9**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [encryption](/api/@graphorin/store-sqlite/encryption/index.md) / PassphraseResolver

# Type Alias: PassphraseResolver

```ts
type PassphraseResolver = () => Promise<string | Buffer>;
```

Defined in: packages/store-sqlite/src/encryption/index.ts:85

**`Stable`**

Passphrase resolver shape. Implementations live in
`@graphorin/security` (`'env:GRAPHORIN_DB_PASSPHRASE'`,
`'keyring:graphorin/db'`, …). The resolver may return `Buffer` for
binary-keyed cipher variants.

## Returns

`Promise`\&lt;`string` \| `Buffer`\&gt;
