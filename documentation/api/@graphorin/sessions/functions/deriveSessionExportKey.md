[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / deriveSessionExportKey

# Function: deriveSessionExportKey()

```ts
function deriveSessionExportKey(passphrase, salt): Promise<Uint8Array<ArrayBufferLike>>;
```

Defined in: packages/sessions/src/export/writer.ts:253

Derive a 32-byte AES key from a passphrase + salt. Exposed for
symmetry with the importer, which must supply the same salt to
produce the same key.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `passphrase` | `string` \| `Uint8Array`\&lt;`ArrayBufferLike`\&gt; |
| `salt` | `Uint8Array` |

## Returns

`Promise`\<`Uint8Array`\&lt;`ArrayBufferLike`\&gt;\>

## Stable
