[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / installBuiltinResolvers

# Function: installBuiltinResolvers()

```ts
function installBuiltinResolvers(opts?): void;
```

Defined in: packages/security/src/secrets/resolvers/index.ts:26

**`Stable`**

Idempotently install the seven built-in resolvers. Safe to call
multiple times - replays no-op if the registry already has them.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `allowReplace?`: `boolean`; \} |
| `opts.allowReplace?` | `boolean` |

## Returns

`void`
