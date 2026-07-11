[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / bytesToBase64

# Function: bytesToBase64()

```ts
function bytesToBase64(bytes): string;
```

Defined in: [packages/core/src/utils/binary-json.ts:168](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L168)

Encode bytes as standard (padded) base64 without relying on `Buffer`
or `btoa`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `bytes` | `Uint8Array` |

## Returns

`string`

## Stable
