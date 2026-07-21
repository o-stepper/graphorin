[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / Argon2idFn

# Type Alias: Argon2idFn

```ts
type Argon2idFn = (password, options) => Promise<Buffer>;
```

Defined in: packages/security/src/secrets/resolvers/encrypted-file.ts:58

**`Stable`**

Signature of the argon2id KDF the encrypted-file resolver calls -
swappable via `_setArgon2idForTesting`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `password` | `Buffer` \| `string` |
| `options` | \{ `memoryCost`: `number`; `outputLen`: `number`; `parallelism`: `number`; `salt`: `Buffer`; `timeCost`: `number`; \} |
| `options.memoryCost` | `number` |
| `options.outputLen` | `number` |
| `options.parallelism` | `number` |
| `options.salt` | `Buffer` |
| `options.timeCost` | `number` |

## Returns

`Promise`\&lt;`Buffer`\&gt;
