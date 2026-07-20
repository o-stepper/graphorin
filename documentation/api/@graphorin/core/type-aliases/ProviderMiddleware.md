[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProviderMiddleware

# Type Alias: ProviderMiddleware

```ts
type ProviderMiddleware = (next) => Provider;
```

Defined in: packages/core/src/contracts/provider.ts:315

**`Stable`**

Provider middleware: a function that wraps a `Provider` and returns a
new `Provider` with extra behaviour (retry, fallback, redaction, …).

Middleware ordering is enforced by the runtime per the documented
inside-out chain (innermost adapter → ... → outermost retry / observer).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `next` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) |

## Returns

[`Provider`](/api/@graphorin/core/interfaces/Provider.md)
