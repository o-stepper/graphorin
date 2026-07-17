[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProviderMiddleware

# Type Alias: ProviderMiddleware

```ts
type ProviderMiddleware = (next) => Provider;
```

Defined in: [packages/core/src/contracts/provider.ts:315](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L315)

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

## Stable
