[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / parseSecretsSourceEnv

# Function: parseSecretsSourceEnv()

```ts
function parseSecretsSourceEnv(raw): 
  | {
  fallbackChain?: readonly ("env" | "keyring" | "encrypted-file" | "memory")[];
  kind: SecretsStoreKind;
}
  | undefined;
```

Defined in: packages/security/src/secrets/factory.ts:266

**`Stable`**

Parse the `GRAPHORIN_SECRETS_SOURCE` env value (per the documented
`--secrets-source` flag policy). Accepts a single store kind
(`'keyring'`, `'encrypted-file'`, `'env'`, `'memory'`, `'auto'`) or
a comma-separated chain (e.g. `'keyring,encrypted-file'`). Returns
`undefined` when the env is unset.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `string` \| `undefined` |

## Returns

  \| \{
  `fallbackChain?`: readonly (`"env"` \| `"keyring"` \| `"encrypted-file"` \| `"memory"`)[];
  `kind`: [`SecretsStoreKind`](/api/@graphorin/security/type-aliases/SecretsStoreKind.md);
\}
  \| `undefined`
