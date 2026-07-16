[**Graphorin API reference v0.9.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [encryption](/api/@graphorin/store-sqlite/encryption/index.md) / PassphraseResolver

# Type Alias: PassphraseResolver

```ts
type PassphraseResolver = () => Promise<string | Buffer>;
```

Defined in: [packages/store-sqlite/src/encryption/index.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/encryption/index.ts#L85)

Passphrase resolver shape. Implementations live in
`@graphorin/security` (`'env:GRAPHORIN_DB_PASSPHRASE'`,
`'keyring:graphorin/db'`, …). The resolver may return `Buffer` for
binary-keyed cipher variants.

## Returns

`Promise`\&lt;`string` \| `Buffer`\&gt;

## Stable
