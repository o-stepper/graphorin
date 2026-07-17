[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / WithRetryOptions

# Interface: WithRetryOptions

Defined in: [packages/provider/src/middleware/with-retry.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-retry.ts#L20)

Options for [withRetry](/api/@graphorin/provider/variables/withRetry.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-backoff"></a> `backoff?` | `readonly` | `"exponential"` \| `"linear"` \| `"constant"` | - | [packages/provider/src/middleware/with-retry.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-retry.ts#L22) |
| <a id="property-initialdelayms"></a> `initialDelayMs?` | `readonly` | `number` | - | [packages/provider/src/middleware/with-retry.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-retry.ts#L23) |
| <a id="property-jitter"></a> `jitter?` | `readonly` | `boolean` | - | [packages/provider/src/middleware/with-retry.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-retry.ts#L25) |
| <a id="property-maxdelayms"></a> `maxDelayMs?` | `readonly` | `number` | - | [packages/provider/src/middleware/with-retry.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-retry.ts#L24) |
| <a id="property-maxretries"></a> `maxRetries?` | `readonly` | `number` | - | [packages/provider/src/middleware/with-retry.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-retry.ts#L21) |
| <a id="property-retryableerrors"></a> `retryableErrors?` | `readonly` | (`err`) => `boolean` | - | [packages/provider/src/middleware/with-retry.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-retry.ts#L26) |
| <a id="property-sleepimpl"></a> `sleepImpl?` | `readonly` | (`ms`, `signal?`) => `Promise`\&lt;`void`\&gt; | Optional sleep override (test fixtures use a synchronous resolver). | [packages/provider/src/middleware/with-retry.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/middleware/with-retry.ts#L28) |
