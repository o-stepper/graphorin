[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / MIDDLEWARE\_KIND

# Variable: MIDDLEWARE\_KIND

```ts
const MIDDLEWARE_KIND: unique symbol;
```

Defined in: [packages/provider/src/middleware/compose.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/compose.ts#L24)

Symbol attached to every middleware-produced provider so the
composer can detect and validate the chain. The symbol is opaque
and cross-realm safe via `Symbol.for`.

## Stable
