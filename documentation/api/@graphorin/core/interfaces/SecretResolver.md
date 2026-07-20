[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SecretResolver

# Interface: SecretResolver

Defined in: packages/core/src/contracts/secrets-store.ts:13

**`Stable`**

Pluggable secret resolver - turns a parsed `SecretRef` into a live
`SecretValue`. Concrete resolvers live in `@graphorin/security` (env,
keyring, file, encrypted-file, literal, ref, vault) and in optional
adapter packages (`@graphorin/secret-1password`, …).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-scheme"></a> `scheme` | `readonly` | `string` | Lowercased URI scheme handled by this resolver (`'env'`, `'op'`, …). | packages/core/src/contracts/secrets-store.ts:15 |

## Methods

### resolve()

```ts
resolve(ref, ctx?): Promise<SecretValue>;
```

Defined in: packages/core/src/contracts/secrets-store.ts:16

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `ref` | [`SecretRef`](/api/@graphorin/core/interfaces/SecretRef.md) |
| `ctx?` | [`SecretResolverContext`](/api/@graphorin/core/interfaces/SecretResolverContext.md) |

#### Returns

`Promise`\&lt;[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md)\&gt;
