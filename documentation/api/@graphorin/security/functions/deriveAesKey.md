[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / deriveAesKey

# Function: deriveAesKey()

```ts
function deriveAesKey(passphrase, salt): Promise<Buffer<ArrayBufferLike>>;
```

Defined in: [packages/security/src/secrets/resolvers/encrypted-file.ts:115](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/resolvers/encrypted-file.ts#L115)

Derive a 32-byte AES-256-GCM key from a passphrase + salt.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `passphrase` | `string` \| `Buffer`\&lt;`ArrayBufferLike`\&gt; |
| `salt` | `Buffer` |

## Returns

`Promise`\<`Buffer`\&lt;`ArrayBufferLike`\&gt;\>

## Stable
