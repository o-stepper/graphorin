[**Graphorin API reference v0.12.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [reconnect](/api/@graphorin/client/reconnect/index.md) / BackoffPolicy

# Interface: BackoffPolicy

Defined in: [packages/client/src/reconnect.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/reconnect.ts#L23)

Stable shape consumed by [computeBackoffMs](/api/@graphorin/client/reconnect/functions/computeBackoffMs.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-basems"></a> `baseMs?` | `readonly` | `number` | Initial slot in milliseconds. Default `500`. | [packages/client/src/reconnect.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/reconnect.ts#L25) |
| <a id="property-maxattempts"></a> `maxAttempts?` | `readonly` | `number` | Hard cap on the number of attempts. The client surfaces a `TransportFailedError` once exceeded. Default `Infinity`. | [packages/client/src/reconnect.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/reconnect.ts#L32) |
| <a id="property-maxms"></a> `maxMs?` | `readonly` | `number` | Cap on every individual sleep. Default `30_000`. | [packages/client/src/reconnect.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/reconnect.ts#L27) |
| <a id="property-random"></a> `random?` | `readonly` | () => `number` | Optional injection seam used by tests; defaults to `Math.random`. | [packages/client/src/reconnect.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/reconnect.ts#L36) |
