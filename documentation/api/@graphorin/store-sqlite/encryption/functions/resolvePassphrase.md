[**Graphorin API reference v0.11.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [encryption](/api/@graphorin/store-sqlite/encryption/index.md) / resolvePassphrase

# Function: resolvePassphrase()

```ts
function resolvePassphrase(config): Promise<string>;
```

Defined in: [packages/store-sqlite/src/encryption/index.ts:135](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/encryption/index.ts#L135)

Resolves the configured passphrase to a SQL-literal-ready value
suitable for `PRAGMA key = <literal>`. UTF-8 passphrases are returned
as a single-quoted SQL string with internal `'` doubled; binary keys
are returned in the cipher peer's hex form (`x'<hex>'`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`EncryptionConfig`](/api/@graphorin/store-sqlite/encryption/type-aliases/EncryptionConfig.md) |

## Returns

`Promise`\&lt;`string`\&gt;

## Stable
