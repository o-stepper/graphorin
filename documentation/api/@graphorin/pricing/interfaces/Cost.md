[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / Cost

# Interface: Cost

Defined in: core/dist/types/usage.d.ts:24

Money figure attached to a `Usage`. Always carries a 3-letter currency
code so that consumers can perform aggregation safely.

## Stable

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-amount"></a> `amount` | `number` | Amount in the smallest fractional unit of the declared currency. | core/dist/types/usage.d.ts:26 |
| <a id="property-currency"></a> `currency` | `string` | ISO-4217 currency code; default `'USD'`. | core/dist/types/usage.d.ts:28 |
