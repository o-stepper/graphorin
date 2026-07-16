[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Cost

# Interface: Cost

Defined in: [packages/core/src/types/usage.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/usage.ts#L46)

Money figure attached to a `Usage`. Always carries a 3-letter currency
code so that consumers can perform aggregation safely.

## Stable

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-amount"></a> `amount` | `number` | Amount in WHOLE units of `currency` - for USD that is dollars, and fractional values are expected (a typical LLM call costs a fraction of a cent, e.g. `0.0042`). This is deliberately NOT "minor units" / cents (W-045): the canonical producer - `calculateCost` in `@graphorin/pricing` - and every consumer (`CostTracker` in `@graphorin/observability`, the memory consolidator's `costUsd` budget, persisted checkpoints) already operate in whole currency units, and sub-cent per-call figures make minor units impractical. Do not divide by 100. | [packages/core/src/types/usage.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/usage.ts#L58) |
| <a id="property-currency"></a> `currency` | `string` | ISO-4217 currency code; default `'USD'`. | [packages/core/src/types/usage.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/usage.ts#L60) |
