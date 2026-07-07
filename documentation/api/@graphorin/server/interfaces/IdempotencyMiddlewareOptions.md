[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / IdempotencyMiddlewareOptions

# Interface: IdempotencyMiddlewareOptions

Defined in: [packages/server/src/middleware/idempotency.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/idempotency.ts#L44)

Options accepted by [createIdempotencyMiddleware](/api/@graphorin/server/functions/createIdempotencyMiddleware.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config` | `readonly` | \{ `checkBodyFingerprint`: `boolean`; `enabled`: `boolean`; `lruCacheSize`: `number`; `requireKey`: [`IdempotencyRequireKeyMode`](/api/@graphorin/server/config/type-aliases/IdempotencyRequireKeyMode.md); `ttlSeconds`: `number`; \} | - | [packages/server/src/middleware/idempotency.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/idempotency.ts#L53) |
| `config.checkBodyFingerprint` | `readonly` | `boolean` | - | [packages/server/src/config.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/config.ts#L73) |
| `config.enabled` | `readonly` | `boolean` | - | [packages/server/src/config.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/config.ts#L70) |
| `config.lruCacheSize` | `readonly` | `number` | - | [packages/server/src/config.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/config.ts#L74) |
| `config.requireKey` | `readonly` | [`IdempotencyRequireKeyMode`](/api/@graphorin/server/config/type-aliases/IdempotencyRequireKeyMode.md) | - | [packages/server/src/config.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/config.ts#L71) |
| `config.ttlSeconds` | `readonly` | `number` | - | [packages/server/src/config.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/config.ts#L72) |
| <a id="property-excluderesponsecachepaths"></a> `excludeResponseCachePaths?` | `readonly` | readonly `string`[] | Paths whose responses are NEVER cached or replayed (IP-6) - the middleware passes straight through. Used for secret-bearing endpoints (`POST /v1/tokens` returns a raw token; caching it would persist the secret plaintext in durable SQLite for the TTL). | [packages/server/src/middleware/idempotency.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/idempotency.ts#L51) |
| <a id="property-metricregistry"></a> `metricRegistry?` | `readonly` | [`MetricRegistry`](/api/@graphorin/server/classes/MetricRegistry.md) | IP-15: when supplied, the middleware publishes a live `graphorin_idempotency_cache_hit_ratio` gauge (replays / replays+executes) instead of leaving the registered metric a permanently-empty series. | [packages/server/src/middleware/idempotency.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/idempotency.ts#L61) |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Wall-clock provider; tests inject a deterministic generator. | [packages/server/src/middleware/idempotency.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/idempotency.ts#L55) |
| <a id="property-store"></a> `store` | `readonly` | [`IdempotencyStore`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md) | - | [packages/server/src/middleware/idempotency.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/middleware/idempotency.ts#L52) |
