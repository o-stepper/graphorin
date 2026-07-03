[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / md5

# Function: md5()

```ts
function md5(content): string;
```

Defined in: packages/core/src/utils/hash.ts:15

MD5 hex digest. Used by the memory layer for content deduplication
(`MD5(content)` is the dedup key for incoming facts / messages).

MD5 is **not** a cryptographic primitive in this codebase — it's used
exclusively for collision-resistant content addressing where
collision-resistance is the desired property, not pre-image resistance.
Do not use this helper for password hashing, MAC, or any other
security-sensitive use case (use `@graphorin/security` for those).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | `string` \| `Uint8Array`\&lt;`ArrayBufferLike`\&gt; |

## Returns

`string`

## Stable
