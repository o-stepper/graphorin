[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / encodeBase62Bytes

# Function: encodeBase62Bytes()

```ts
function encodeBase62Bytes(bytes, width): string;
```

Defined in: packages/security/src/auth/token-format.ts:191

Encode a byte buffer as base62 with a fixed-length output. The
routine treats the bytes as a big-endian unbounded integer and
left-pads to `width` so that any 32-byte input yields exactly 43
base62 characters.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `bytes` | `Uint8Array` |
| `width` | `number` |

## Returns

`string`

## Stable
