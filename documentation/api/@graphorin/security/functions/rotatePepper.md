[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / rotatePepper

# Function: rotatePepper()

```ts
function rotatePepper(options): Promise<{
  skipped: number;
  updated: number;
}>;
```

Defined in: packages/security/src/auth/crud.ts:194

Re-HMAC every token row with a new pepper. The previous pepper is
required to derive the per-row plaintext via re-hashing — the
function therefore only supports the rolling-deployment use case
where the framework still holds the old pepper at the time of
rotation.

The store update is per-row; the caller is responsible for running
the helper inside an outer transaction when atomicity matters.

Returns the number of rows the helper would update; when
`dryRun: true` the store is not touched.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `dryRun?`: `boolean`; `newPepper`: [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md); `oldHashLookup`: (`id`) => `Promise`\&lt;`string` \| `null`\&gt;; `recomputeHash`: (`id`, `oldHashHex`) => `Promise`\&lt;`string` \| `null`\&gt;; `tokenStore`: [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md); \} |
| `options.dryRun?` | `boolean` |
| `options.newPepper` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) |
| `options.oldHashLookup` | (`id`) => `Promise`\&lt;`string` \| `null`\&gt; |
| `options.recomputeHash` | (`id`, `oldHashHex`) => `Promise`\&lt;`string` \| `null`\&gt; |
| `options.tokenStore` | [`AuthTokenStore`](/api/@graphorin/core/interfaces/AuthTokenStore.md) |

## Returns

`Promise`\<\{
  `skipped`: `number`;
  `updated`: `number`;
\}\>

## Stable
