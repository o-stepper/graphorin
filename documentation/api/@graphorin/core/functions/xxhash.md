[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / xxhash

# Function: xxhash()

```ts
function xxhash(input, seed?): string;
```

Defined in: packages/core/src/utils/hash.ts:37

Pure-JS XXH32 implementation. Used by the memory-modification guard
— fast, non-cryptographic content fingerprinting (`xxhash(content)`
tracks whether a tool's view of memory has shifted while the LLM was
thinking).

Not security-sensitive — never use for tampering detection of an
untrusted attacker; for that the audit log uses SHA-256 (in
`@graphorin/security`).

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `input` | `string` \| `Uint8Array`\&lt;`ArrayBufferLike`\&gt; | `undefined` |
| `seed` | `number` | `0` |

## Returns

`string`

## Stable
