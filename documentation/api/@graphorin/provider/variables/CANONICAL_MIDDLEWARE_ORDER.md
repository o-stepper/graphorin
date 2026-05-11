[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / CANONICAL\_MIDDLEWARE\_ORDER

# Variable: CANONICAL\_MIDDLEWARE\_ORDER

```ts
const CANONICAL_MIDDLEWARE_ORDER: readonly string[];
```

Defined in: packages/provider/src/middleware/compose.ts:33

Canonical middleware ordering — outermost → innermost. The table
is enforced by [composeProviderMiddleware](/api/@graphorin/provider/functions/composeProviderMiddleware.md) and is part of the
provider layer's public contract (DEC-145 / ADR-039).

## Stable
