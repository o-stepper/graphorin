[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / RefreshPricingOptions

# Interface: RefreshPricingOptions

Defined in: [packages/pricing/src/refresh.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/refresh.ts#L26)

Configuration shape for [refreshPricing](/api/@graphorin/pricing/functions/refreshPricing.md). The `fetchImpl`
override exists so tests can exercise the function without making
a real network call.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-fetchimpl"></a> `fetchImpl?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | Optional fetch override - useful in tests. | [packages/pricing/src/refresh.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/refresh.ts#L32) |
| <a id="property-format"></a> `format?` | `readonly` | `"genai-prices"` \| `"auto"` \| `"graphorin"` | W-097: accepted body format. `'auto'` (default) tries the native graphorin shape, then auto-detects + converts the `@pydantic/genai-prices` dataset; the explicit values pin one format and fail fast on anything else. | [packages/pricing/src/refresh.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/refresh.ts#L53) |
| <a id="property-headers"></a> `headers?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | Optional headers (auth, conditional GET, etc.). | [packages/pricing/src/refresh.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/refresh.ts#L30) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Caller-supplied abort signal, combined with the timeout. | [packages/pricing/src/refresh.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/refresh.ts#L46) |
| <a id="property-snapshotdate"></a> `snapshotDate?` | `readonly` | `string` | Override the snapshot date stamped on the result. Defaults to today. | [packages/pricing/src/refresh.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/refresh.ts#L34) |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Hard timeout for the network fetch in milliseconds. Default `30000`. Aborts the request (and throws) if the upstream is slow or unreachable so `graphorin pricing refresh` cannot hang. Pass an explicit [RefreshPricingOptions.signal](/api/@graphorin/pricing/interfaces/RefreshPricingOptions.md#property-signal) to manage cancellation yourself; the two are combined. | [packages/pricing/src/refresh.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/refresh.ts#L44) |
| <a id="property-url"></a> `url` | `readonly` | `string` | Snapshot URL - typically the upstream pricing JSON. | [packages/pricing/src/refresh.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/refresh.ts#L28) |
| <a id="property-version"></a> `version?` | `readonly` | `string` | Override the snapshot version string. Defaults to `'graphorin/0.1+refreshed'`. | [packages/pricing/src/refresh.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/refresh.ts#L36) |
