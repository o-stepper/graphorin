[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / WithRetryOptions

# Interface: WithRetryOptions

Defined in: packages/provider/src/middleware/with-retry.ts:20

**`Stable`**

Options for [withRetry](/api/@graphorin/provider/variables/withRetry.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-backoff"></a> `backoff?` | `readonly` | `"exponential"` \| `"linear"` \| `"constant"` | - | packages/provider/src/middleware/with-retry.ts:22 |
| <a id="property-initialdelayms"></a> `initialDelayMs?` | `readonly` | `number` | - | packages/provider/src/middleware/with-retry.ts:23 |
| <a id="property-jitter"></a> `jitter?` | `readonly` | `boolean` | - | packages/provider/src/middleware/with-retry.ts:25 |
| <a id="property-maxdelayms"></a> `maxDelayMs?` | `readonly` | `number` | - | packages/provider/src/middleware/with-retry.ts:24 |
| <a id="property-maxretries"></a> `maxRetries?` | `readonly` | `number` | - | packages/provider/src/middleware/with-retry.ts:21 |
| <a id="property-retryableerrors"></a> `retryableErrors?` | `readonly` | (`err`) => `boolean` | - | packages/provider/src/middleware/with-retry.ts:26 |
| <a id="property-sleepimpl"></a> `sleepImpl?` | `readonly` | (`ms`, `signal?`) => `Promise`\&lt;`void`\&gt; | Optional sleep override (test fixtures use a synchronous resolver). | packages/provider/src/middleware/with-retry.ts:28 |
