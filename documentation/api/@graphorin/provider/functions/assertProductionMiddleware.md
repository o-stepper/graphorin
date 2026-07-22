[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / assertProductionMiddleware

# Function: assertProductionMiddleware()

```ts
function assertProductionMiddleware(provider, options?): void;
```

Defined in: packages/provider/src/middleware/production-hook.ts:35

**`Stable`**

Throw [MissingProductionMiddlewareError](/api/@graphorin/provider/classes/MissingProductionMiddlewareError.md) if a required
middleware is missing from the chain rooted at `provider`. The
check runs only when `NODE_ENV === 'production'` unless `force` is
`true`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `provider` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) |
| `options` | [`ProductionStartupHookOptions`](/api/@graphorin/provider/interfaces/ProductionStartupHookOptions.md) |

## Returns

`void`
