[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / encryptBody

# Function: encryptBody()

```ts
function encryptBody(body, key): Uint8Array;
```

Defined in: packages/sessions/src/export/writer.ts:270

**`Stable`**

Convenience: AES-256-GCM encrypt a body buffer. The IV is generated
fresh and prepended; the auth tag is appended. Output layout:
`[iv (12)][ciphertext][tag (16)]`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `Uint8Array` |
| `key` | `Uint8Array` |

## Returns

`Uint8Array`
