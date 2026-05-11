[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / hashRegion

# Function: hashRegion()

```ts
function hashRegion(input, seed?): Promise<string>;
```

Defined in: packages/security/src/guard/xxhash.ts:31

Convenience: hash a snapshot region asynchronously. The wrapper
exists so callers can micro-benchmark the helper without rewriting
the surrounding loop.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `input` | `string` \| `Uint8Array`\&lt;`ArrayBufferLike`\&gt; | `undefined` |
| `seed` | `number` | `0` |

## Returns

`Promise`\&lt;`string`\&gt;

## Stable
