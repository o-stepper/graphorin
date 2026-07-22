[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / IdempotencyMiddlewareOptions

# Interface: IdempotencyMiddlewareOptions

Defined in: packages/server/src/middleware/idempotency.ts:44

**`Stable`**

Options accepted by [createIdempotencyMiddleware](/api/@graphorin/server/functions/createIdempotencyMiddleware.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config` | `readonly` | \{ `checkBodyFingerprint`: `boolean`; `enabled`: `boolean`; `lruCacheSize`: `number`; `requireKey`: [`IdempotencyRequireKeyMode`](/api/@graphorin/server/config/type-aliases/IdempotencyRequireKeyMode.md); `ttlSeconds`: `number`; \} | - | packages/server/src/middleware/idempotency.ts:53 |
| `config.checkBodyFingerprint` | `readonly` | `boolean` | - | packages/server/src/config.ts:82 |
| `config.enabled` | `readonly` | `boolean` | - | packages/server/src/config.ts:79 |
| `config.lruCacheSize` | `readonly` | `number` | - | packages/server/src/config.ts:83 |
| `config.requireKey` | `readonly` | [`IdempotencyRequireKeyMode`](/api/@graphorin/server/config/type-aliases/IdempotencyRequireKeyMode.md) | - | packages/server/src/config.ts:80 |
| `config.ttlSeconds` | `readonly` | `number` | - | packages/server/src/config.ts:81 |
| <a id="property-excluderesponsecachepaths"></a> `excludeResponseCachePaths?` | `readonly` | readonly `string`[] | Paths whose responses are NEVER cached or replayed - the middleware passes straight through. Used for secret-bearing endpoints (`POST /v1/tokens` returns a raw token; caching it would persist the secret plaintext in durable SQLite for the TTL). | packages/server/src/middleware/idempotency.ts:51 |
| <a id="property-metricregistry"></a> `metricRegistry?` | `readonly` | [`MetricRegistry`](/api/@graphorin/server/classes/MetricRegistry.md) | When supplied, the middleware publishes a live `graphorin_idempotency_cache_hit_ratio` gauge (replays / replays+executes) instead of leaving the registered metric a permanently-empty series. | packages/server/src/middleware/idempotency.ts:61 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Wall-clock provider; tests inject a deterministic generator. | packages/server/src/middleware/idempotency.ts:55 |
| <a id="property-store"></a> `store` | `readonly` | [`IdempotencyStore`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md) | - | packages/server/src/middleware/idempotency.ts:52 |
