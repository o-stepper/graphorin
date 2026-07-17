[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / CANONICAL\_MIDDLEWARE\_ORDER

# Variable: CANONICAL\_MIDDLEWARE\_ORDER

```ts
const CANONICAL_MIDDLEWARE_ORDER: readonly string[];
```

Defined in: [packages/provider/src/middleware/compose.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/compose.ts#L53)

Canonical middleware ordering - outermost → innermost. The table
is enforced by [composeProviderMiddleware](/api/@graphorin/provider/functions/composeProviderMiddleware.md) and is part of the
provider layer's public contract (DEC-145 / ADR-039).

## Why this order

Composition is outermost-first, so a request flows top→bottom and a
response flows bottom→top:

- `withTracing` is outermost so the span wraps everything below -
  including retries - and records true end-to-end latency.
- `withRetry` sits above the rate/cost limiters so each retry
  attempt is independently counted and throttled.
- `withRateLimit` → `withCostLimit` → `withCostTracking` form the
  budget stack: throttle before admitting, reject over-budget calls
  before spending, then meter what actually went through.
- `withFallback` is just above redaction so a fallback to a
  secondary provider still passes through the redactor.
- `withRedaction` is **innermost** (closest to the provider) so it
  is the last thing to touch the outbound payload and the first to
  touch the inbound stream - guaranteeing every retry, fallback, and
  cost-tracked request sees an already-redacted payload and no
  secret can bypass it.

## Stable
