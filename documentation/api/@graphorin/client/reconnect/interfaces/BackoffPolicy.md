[**Graphorin API reference v0.13.12**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [reconnect](/api/@graphorin/client/reconnect/index.md) / BackoffPolicy

# Interface: BackoffPolicy

Defined in: packages/client/src/reconnect.ts:23

**`Stable`**

Stable shape consumed by [computeBackoffMs](/api/@graphorin/client/reconnect/functions/computeBackoffMs.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-basems"></a> `baseMs?` | `readonly` | `number` | Initial slot in milliseconds. Default `500`. | packages/client/src/reconnect.ts:25 |
| <a id="property-maxattempts"></a> `maxAttempts?` | `readonly` | `number` | Hard cap on the number of attempts. The client surfaces a `TransportFailedError` once exceeded. Default `Infinity`. | packages/client/src/reconnect.ts:32 |
| <a id="property-maxms"></a> `maxMs?` | `readonly` | `number` | Cap on every individual sleep. Default `30_000`. | packages/client/src/reconnect.ts:27 |
| <a id="property-random"></a> `random?` | `readonly` | () => `number` | Optional injection seam used by tests; defaults to `Math.random`. | packages/client/src/reconnect.ts:36 |
