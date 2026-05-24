[**Graphorin API reference v0.3.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [encryption](/api/@graphorin/store-sqlite/encryption/index.md) / EncryptionConfig

# Type Alias: EncryptionConfig

```ts
type EncryptionConfig = 
  | {
  enabled: false;
}
  | {
  cipher?: EncryptionCipher;
  enabled: true;
  passphraseResolver: PassphraseResolver;
};
```

Defined in: packages/store-sqlite/src/encryption/index.ts:33

Encryption-at-rest configuration. Default `{ enabled: false }`.

## Union Members

### Type Literal

```ts
{
  enabled: false;
}
```

***

### Type Literal

```ts
{
  cipher?: EncryptionCipher;
  enabled: true;
  passphraseResolver: PassphraseResolver;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `cipher?` | [`EncryptionCipher`](/api/@graphorin/store-sqlite/encryption/type-aliases/EncryptionCipher.md) | - | packages/store-sqlite/src/encryption/index.ts:37 |
| `enabled` | `true` | - | packages/store-sqlite/src/encryption/index.ts:36 |
| `passphraseResolver` | [`PassphraseResolver`](/api/@graphorin/store-sqlite/encryption/type-aliases/PassphraseResolver.md) | Resolves the passphrase at startup. Returns the raw passphrase string (the caller is responsible for clearing it from memory after the connection is open). Inputs typically come from a `SecretValue` resolver in `@graphorin/security` or from an operator-supplied env var. | packages/store-sqlite/src/encryption/index.ts:45 |

## Stable
