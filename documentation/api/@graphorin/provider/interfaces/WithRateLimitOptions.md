[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / WithRateLimitOptions

# Interface: WithRateLimitOptions

Defined in: packages/provider/src/middleware/with-rate-limit.ts:20

Options for [withRateLimit](/api/@graphorin/provider/variables/withRateLimit.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-burst"></a> `burst?` | `readonly` | `number` | Burst size - defaults to `requestsPerMinute / 4` (rounded up to >= 1). | packages/provider/src/middleware/with-rate-limit.ts:24 |
| <a id="property-mode"></a> `mode?` | `readonly` | `"throw"` \| `"queue"` | What to do on overflow. Default `'throw'`. | packages/provider/src/middleware/with-rate-limit.ts:26 |
| <a id="property-nowimpl"></a> `nowImpl?` | `readonly` | () => `number` | Test hook overriding `Date.now`. | packages/provider/src/middleware/with-rate-limit.ts:28 |
| <a id="property-requestsperminute"></a> `requestsPerMinute` | `readonly` | `number` | Allowed requests per minute. | packages/provider/src/middleware/with-rate-limit.ts:22 |
| <a id="property-sleepimpl"></a> `sleepImpl?` | `readonly` | (`ms`, `signal?`) => `Promise`\&lt;`void`\&gt; | Test hook overriding `setTimeout`-based wait. | packages/provider/src/middleware/with-rate-limit.ts:30 |
