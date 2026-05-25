[**Graphorin API reference v0.4.0**](../../../index.md)

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

Defined in: pricing/src/lookup.ts:99

Multiply a per-token price by an integer token count. Returns `null`
when the price is unknown. Useful when caller wants to compute cost
for a single LLM call without instantiating the cost tracker.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `args` | [`LookupPriceArgs`](/api/@graphorin/pricing/interfaces/LookupPriceArgs.md) & \{ `cachedReadTokens?`: `number`; `inputTokens`: `number`; `outputTokens`: `number`; `reasoningTokens?`: `number`; \} | `undefined` |
| `snapshot` | [`PricingSnapshot`](/api/@graphorin/pricing/interfaces/PricingSnapshot.md) | `BUNDLED_SNAPSHOT` |

## Returns

  \| \{
  `amount`: `number`;
  `currency`: `"USD"`;
\}
  \| `null`

## Stable
