[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / composeProviderMiddleware

# Function: composeProviderMiddleware()

```ts
function composeProviderMiddleware(middlewares): ProviderMiddleware;
```

Defined in: [packages/provider/src/middleware/compose.ts:136](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/compose.ts#L136)

Wrap an adapter in a middleware chain whose order is validated
against [CANONICAL\_MIDDLEWARE\_ORDER](/api/@graphorin/provider/variables/CANONICAL_MIDDLEWARE_ORDER.md). The argument array MUST
be ordered outermost → innermost - the same way the layers appear
in the documented composition example. The composer validates that
every kind known to the canonical order is monotonically non-
decreasing in index, throws otherwise.

Custom middleware whose kind is NOT in the canonical order is
silently allowed at any position - operators registering bespoke
layers via [defineProviderMiddleware](/api/@graphorin/provider/functions/defineProviderMiddleware.md) carry the
responsibility of placing them sensibly.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `middlewares` | readonly [`ProviderMiddleware`](/api/@graphorin/core/type-aliases/ProviderMiddleware.md)[] |

## Returns

[`ProviderMiddleware`](/api/@graphorin/core/type-aliases/ProviderMiddleware.md)

## Stable
