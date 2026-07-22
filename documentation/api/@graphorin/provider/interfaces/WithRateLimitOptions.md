[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / WithRateLimitOptions

# Interface: WithRateLimitOptions

Defined in: packages/provider/src/middleware/with-rate-limit.ts:27

**`Stable`**

Options for [withRateLimit](/api/@graphorin/provider/variables/withRateLimit.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-burst"></a> `burst?` | `readonly` | `number` | Burst size - defaults to `requestsPerMinute / 4` (rounded up to >= 1). | packages/provider/src/middleware/with-rate-limit.ts:31 |
| <a id="property-estimatetokens"></a> `estimateTokens?` | `readonly` | (`req`) => `number` | Estimator for a request's token weight (only consulted when `tokensPerMinute` is set). The default is the deliberate cheap heuristic `ceil(textChars / 4) + (maxTokens ?? 0)` - synchronous and allocation-free, because this runs in the request hot path and must not add latency or network. Wire the counter from `@graphorin/provider/counters` (`createDefaultCounter`) here when you need provider-accurate weights. | packages/provider/src/middleware/with-rate-limit.ts:51 |
| <a id="property-mode"></a> `mode?` | `readonly` | `"throw"` \| `"queue"` | What to do on overflow. Default `'throw'`. | packages/provider/src/middleware/with-rate-limit.ts:53 |
| <a id="property-nowimpl"></a> `nowImpl?` | `readonly` | () => `number` | Test hook overriding `Date.now`. | packages/provider/src/middleware/with-rate-limit.ts:55 |
| <a id="property-requestsperminute"></a> `requestsPerMinute` | `readonly` | `number` | Allowed requests per minute. | packages/provider/src/middleware/with-rate-limit.ts:29 |
| <a id="property-sleepimpl"></a> `sleepImpl?` | `readonly` | (`ms`, `signal?`) => `Promise`\&lt;`void`\&gt; | Test hook overriding `setTimeout`-based wait. | packages/provider/src/middleware/with-rate-limit.ts:57 |
| <a id="property-tokensperminute"></a> `tokensPerMinute?` | `readonly` | `number` | Optional token budget per minute. When set, each request additionally reserves its estimated token weight from a second bucket whose capacity is the full minute budget; a request whose weight exceeds the remaining budget waits (queue mode) or throws with the TPM-aware `retryAfterMs` (throw mode) even when the RPM bucket has room. Unset: behaviour is byte-identical to the RPM-only limiter. | packages/provider/src/middleware/with-rate-limit.ts:41 |
