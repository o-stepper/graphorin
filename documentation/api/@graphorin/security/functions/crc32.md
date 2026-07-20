[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / crc32

# Function: crc32()

```ts
function crc32(input): number;
```

Defined in: packages/security/src/auth/token-format.ts:130

**`Stable`**

CRC32/IEEE 802.3 implementation. Pure JS, branchless inner loop -
matches the polynomial used by GZIP / PNG / Ethernet (`0xEDB88320`).
Returns an unsigned 32-bit integer so it can be base62-encoded
without further bit-fiddling.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` \| `Uint8Array`\&lt;`ArrayBufferLike`\&gt; |

## Returns

`number`
