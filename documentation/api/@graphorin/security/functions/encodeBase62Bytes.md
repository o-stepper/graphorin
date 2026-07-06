[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / encodeBase62Bytes

# Function: encodeBase62Bytes()

```ts
function encodeBase62Bytes(bytes, width): string;
```

Defined in: [packages/security/src/auth/token-format.ts:204](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/token-format.ts#L204)

Encode a byte buffer as base62 with a fixed-length output. The
routine treats the bytes as a big-endian unbounded integer and
left-pads to `width` so that any 32-byte input yields exactly 43
base62 characters.

Bias note (CodeQL `js/biased-cryptographic-random`): this is **not** a
`byte % 62` reduction over CSPRNG bytes - that would indeed bias the
output. Instead we perform full big-integer long division, so each
emitted base62 character represents a distinct "digit" of the input
integer in base 62. As long as the input is uniform over `[0, 256^n)`
(which is what `crypto.randomBytes(n)` guarantees), the resulting
base62 string is uniform over `[0, 62^width)` for the leading
positions; only the most-significant position can carry a small bias
when `256^n` is not an exact power of 62, and that position is what
`width` left-pads to a constant length for. Callers that need
fixed-entropy tokens should pick `n` such that `256^n >= 62^width` -
the existing `encodeRandomToken` helpers do.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `bytes` | `Uint8Array` |
| `width` | `number` |

## Returns

`string`

## Stable
