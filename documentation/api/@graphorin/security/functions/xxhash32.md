[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / xxhash32

# Function: xxhash32()

```ts
function xxhash32(input, seed?): string;
```

Defined in: packages/security/src/guard/xxhash.ts:20

**`Stable`**

Hash a buffer or a string, returning the 32-bit digest as an
8-character lowercase hex string.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `input` | `string` \| `Uint8Array`\&lt;`ArrayBufferLike`\&gt; | `undefined` |
| `seed` | `number` | `0` |

## Returns

`string`
