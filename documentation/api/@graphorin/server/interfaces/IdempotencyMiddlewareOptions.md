[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / IdempotencyMiddlewareOptions

# Interface: IdempotencyMiddlewareOptions

Defined in: packages/server/src/middleware/idempotency.ts:42

Options accepted by [createIdempotencyMiddleware](/api/@graphorin/server/functions/createIdempotencyMiddleware.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config` | `readonly` | \{ `checkBodyFingerprint`: `boolean`; `enabled`: `boolean`; `lruCacheSize`: `number`; `requireKey`: [`IdempotencyRequireKeyMode`](/api/@graphorin/server/config/type-aliases/IdempotencyRequireKeyMode.md); `ttlSeconds`: `number`; \} | - | packages/server/src/middleware/idempotency.ts:44 |
| `config.checkBodyFingerprint` | `readonly` | `boolean` | - | packages/server/src/config.ts:73 |
| `config.enabled` | `readonly` | `boolean` | - | packages/server/src/config.ts:70 |
| `config.lruCacheSize` | `readonly` | `number` | - | packages/server/src/config.ts:74 |
| `config.requireKey` | `readonly` | [`IdempotencyRequireKeyMode`](/api/@graphorin/server/config/type-aliases/IdempotencyRequireKeyMode.md) | - | packages/server/src/config.ts:71 |
| `config.ttlSeconds` | `readonly` | `number` | - | packages/server/src/config.ts:72 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Wall-clock provider; tests inject a deterministic generator. | packages/server/src/middleware/idempotency.ts:46 |
| <a id="property-store"></a> `store` | `readonly` | [`IdempotencyStore`](/api/@graphorin/store-sqlite/interfaces/IdempotencyStore.md) | - | packages/server/src/middleware/idempotency.ts:43 |
