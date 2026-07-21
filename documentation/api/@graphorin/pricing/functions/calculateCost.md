[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / calculateCost

# Function: calculateCost()

```ts
function calculateCost(args, snapshot?): 
  | {
  amount: number;
  currency: "USD";
}
  | null;
```

Defined in: pricing/src/lookup.ts:163

**`Stable`**

Multiply a per-token price by an integer token count. Returns `null`
when the price is unknown. Useful when caller wants to compute cost
for a single LLM call without instantiating the cost tracker.

Token-count contract:
- `inputTokens` **excludes** `cachedReadTokens` and `cacheWriteTokens` -
  the cache legs are billed separately at their own rates, so pass the
  non-cached prompt count to avoid double-billing.
- `reasoningTokens` are billed at `outputUsdPerToken` unless the model entry
  declares an explicit `reasoningUsdPerToken`.
- `cachedReadTokens` are billed at `cachedReadUsdPerToken` when the entry
  declares one, else at the full input rate (never $0 - a cached read is at
  minimum a normal input token; the fallback never under-bills).
- `cacheWriteTokens` are billed at `cacheWriteUsdPerToken` when the entry
  declares one, else at the full input rate (a cache write is at minimum a
  normal input token - the fallback never under-bills relative to no cache).

Units contract: this is the CANONICAL producer of core
`Cost.amount`, and it returns WHOLE US dollars (per-token USD rates
times token counts) - never cents / minor units. One million input
tokens at `inputUsdPerToken = 3e-6` cost `3` (three dollars).

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `args` | [`LookupPriceArgs`](/api/@graphorin/pricing/interfaces/LookupPriceArgs.md) & \{ `cachedReadTokens?`: `number`; `cacheWriteTokens?`: `number`; `inputTokens`: `number`; `outputTokens`: `number`; `reasoningTokens?`: `number`; \} | `undefined` |
| `snapshot` | [`PricingSnapshot`](/api/@graphorin/pricing/interfaces/PricingSnapshot.md) | `BUNDLED_SNAPSHOT` |

## Returns

  \| \{
  `amount`: `number`;
  `currency`: `"USD"`;
\}
  \| `null`
