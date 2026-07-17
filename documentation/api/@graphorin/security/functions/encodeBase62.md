[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / encodeBase62

# Function: encodeBase62()

```ts
function encodeBase62(bytes, padTo?): string;
```

Defined in: [packages/security/src/hardening/crypto.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/crypto.ts#L65)

Encode a `Uint8Array` as base62url. The optional `padTo` argument
left-pads the output with the base62 zero character so every
emitted string has the same width - useful for fixed-width
downstream parsers. The zero-byte preserve rule still holds: if
every source byte is `0x00`, the returned string is
`'0'.repeat(max(padTo, bytes.length))`.

Exposed so callers can build higher-level token formats
(Phase 03b's token format already uses the same encoding).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `bytes` | `Uint8Array` |
| `padTo?` | `number` |

## Returns

`string`

## Stable
