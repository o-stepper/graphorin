[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / RefreshPricingOptions

# Interface: RefreshPricingOptions

Defined in: pricing/src/refresh.ts:25

Configuration shape for [refreshPricing](/api/@graphorin/pricing/functions/refreshPricing.md). The `fetchImpl`
override exists so tests can exercise the function without making
a real network call.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-fetchimpl"></a> `fetchImpl?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | Optional fetch override — useful in tests. | pricing/src/refresh.ts:31 |
| <a id="property-headers"></a> `headers?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | Optional headers (auth, conditional GET, etc.). | pricing/src/refresh.ts:29 |
| <a id="property-snapshotdate"></a> `snapshotDate?` | `readonly` | `string` | Override the snapshot date stamped on the result. Defaults to today. | pricing/src/refresh.ts:33 |
| <a id="property-url"></a> `url` | `readonly` | `string` | Snapshot URL — typically the upstream pricing JSON. | pricing/src/refresh.ts:27 |
| <a id="property-version"></a> `version?` | `readonly` | `string` | Override the snapshot version string. Defaults to `'graphorin/0.1+refreshed'`. | pricing/src/refresh.ts:35 |
