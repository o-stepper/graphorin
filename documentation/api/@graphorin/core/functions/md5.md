[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / md5

# Function: md5()

```ts
function md5(content): string;
```

Defined in: packages/core/src/utils/hash.ts:17

**`Stable`**

MD5 hex digest. Used by the memory layer for content deduplication
(`MD5(content)` is the dedup key for incoming facts / messages).

MD5 is **not** collision-resistant (practical chosen-prefix
collisions exist) and is **not** used as a cryptographic primitive
here - it is a fast content-addressing convenience where an
adversarial collision merely suppresses a duplicate memory write.
Do not use this helper for password hashing, MAC, tamper evidence,
or any other security-sensitive use case (use `@graphorin/security`
for those; the audit log uses SHA-256).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | `string` \| `Uint8Array`\&lt;`ArrayBufferLike`\&gt; |

## Returns

`string`
