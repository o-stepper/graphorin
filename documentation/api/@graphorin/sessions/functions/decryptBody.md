[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / decryptBody

# Function: decryptBody()

```ts
function decryptBody(body, key): Uint8Array;
```

Defined in: packages/sessions/src/export/reader.ts:315

**`Stable`**

Decrypt a body that was written with `encryptBody(...)`. The layout
is `[iv (12)][ciphertext][tag (16)]`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `Uint8Array` |
| `key` | `Uint8Array` |

## Returns

`Uint8Array`
