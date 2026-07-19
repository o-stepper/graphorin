[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / decryptBundle

# Function: decryptBundle()

```ts
function decryptBundle(bundle, passphrase): Promise<{
  meta: Record<string, unknown>;
  values: Record<string, unknown>;
}>;
```

Defined in: packages/security/src/secrets/resolvers/encrypted-file.ts:132

**`Stable`**

Decrypt a raw bundle into the values map. Used by the resolver and by
the `EncryptedFileSecretsStore` so the wire format stays in one place.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `bundle` | `Buffer` |
| `passphrase` | `string` \| `Buffer`\&lt;`ArrayBufferLike`\&gt; |

## Returns

`Promise`\<\{
  `meta`: `Record`\&lt;`string`, `unknown`\&gt;;
  `values`: `Record`\&lt;`string`, `unknown`\&gt;;
\}\>
