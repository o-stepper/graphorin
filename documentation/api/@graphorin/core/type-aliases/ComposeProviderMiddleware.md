[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ComposeProviderMiddleware

# Type Alias: ComposeProviderMiddleware

```ts
type ComposeProviderMiddleware = (middlewares) => ProviderMiddleware;
```

Defined in: packages/core/src/contracts/provider.ts:328

**`Stable`**

Type signature for the canonical middleware composer (the runtime
implementation lives in `@graphorin/provider`).

The concrete composer guarantees a deterministic ordering - order of
arguments mirrors order of execution from outermost to innermost - and
is the only blessed entry point for chaining middleware in
`@graphorin/*` code (per the security-first ordering rule).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `middlewares` | `ReadonlyArray`\&lt;[`ProviderMiddleware`](/api/@graphorin/core/type-aliases/ProviderMiddleware.md)\&gt; |

## Returns

[`ProviderMiddleware`](/api/@graphorin/core/type-aliases/ProviderMiddleware.md)
