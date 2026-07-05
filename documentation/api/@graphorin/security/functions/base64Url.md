[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / base64Url

# Function: base64Url()

```ts
function base64Url(data): string;
```

Defined in: packages/security/src/oauth/pkce.ts:21

**`Internal`**

Encode `data` as URL-safe base64 without padding.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `data` | `string` \| `Buffer`\&lt;`ArrayBufferLike`\&gt; \| `Uint8Array`\&lt;`ArrayBufferLike`\&gt; |

## Returns

`string`
