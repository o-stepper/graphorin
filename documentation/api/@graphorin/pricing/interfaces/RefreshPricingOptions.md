[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / RefreshPricingOptions

# Interface: RefreshPricingOptions

Defined in: pricing/src/refresh.ts:26

**`Stable`**

Configuration shape for [refreshPricing](/api/@graphorin/pricing/functions/refreshPricing.md). The `fetchImpl`
override exists so tests can exercise the function without making
a real network call.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-fetchimpl"></a> `fetchImpl?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | Optional fetch override - useful in tests. | pricing/src/refresh.ts:32 |
| <a id="property-format"></a> `format?` | `readonly` | `"genai-prices"` \| `"auto"` \| `"graphorin"` | Accepted body format. `'auto'` (default) tries the native graphorin shape, then auto-detects + converts the `@pydantic/genai-prices` dataset; the explicit values pin one format and fail fast on anything else. | pricing/src/refresh.ts:53 |
| <a id="property-headers"></a> `headers?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | Optional headers (auth, conditional GET, etc.). | pricing/src/refresh.ts:30 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Caller-supplied abort signal, combined with the timeout. | pricing/src/refresh.ts:46 |
| <a id="property-snapshotdate"></a> `snapshotDate?` | `readonly` | `string` | Override the snapshot date stamped on the result. Defaults to today. | pricing/src/refresh.ts:34 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Hard timeout for the network fetch in milliseconds. Default `30000`. Aborts the request (and throws) if the upstream is slow or unreachable so `graphorin pricing refresh` cannot hang. Pass an explicit [RefreshPricingOptions.signal](/api/@graphorin/pricing/interfaces/RefreshPricingOptions.md#property-signal) to manage cancellation yourself; the two are combined. | pricing/src/refresh.ts:44 |
| <a id="property-url"></a> `url` | `readonly` | `string` | Snapshot URL - typically the upstream pricing JSON. | pricing/src/refresh.ts:28 |
| <a id="property-version"></a> `version?` | `readonly` | `string` | Override the snapshot version string. Defaults to `'graphorin/0.1+refreshed'`. | pricing/src/refresh.ts:36 |
