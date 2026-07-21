[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / defineProviderMiddleware

# Function: defineProviderMiddleware()

```ts
function defineProviderMiddleware<T>(args): (opts) => ProviderMiddleware;
```

Defined in: packages/provider/src/middleware/compose.ts:193

**`Stable`**

Decorator factory used internally by every built-in middleware. The
returned function attaches the canonical kind discriminator and the
inner-provider symbol so the composer can introspect chains.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `factory`: (`opts`) => [`ProviderMiddleware`](/api/@graphorin/core/type-aliases/ProviderMiddleware.md); `kind`: `string`; \} |
| `args.factory` | (`opts`) => [`ProviderMiddleware`](/api/@graphorin/core/type-aliases/ProviderMiddleware.md) |
| `args.kind` | `string` |

## Returns

(`opts`) => [`ProviderMiddleware`](/api/@graphorin/core/type-aliases/ProviderMiddleware.md)
