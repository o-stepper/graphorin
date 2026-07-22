[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ReplayBufferCheck

# Interface: ReplayBufferCheck

Defined in: packages/server/src/health/checks.ts:101

**`Stable`**

## Extends

- [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-eventsbuffered"></a> `eventsBuffered` | `readonly` | `number` | - | packages/server/src/health/checks.ts:102 |
| <a id="property-message"></a> `message?` | `readonly` | `string` | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`message`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-message) | packages/server/src/health/checks.ts:44 |
| <a id="property-status"></a> `status` | `readonly` | [`HealthStatus`](/api/@graphorin/server/type-aliases/HealthStatus.md) | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`status`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-status) | packages/server/src/health/checks.ts:43 |
| <a id="property-subscribers"></a> `subscribers?` | `readonly` | `number` | - | packages/server/src/health/checks.ts:103 |
| <a id="property-subscriptions"></a> `subscriptions?` | `readonly` | `number` | - | packages/server/src/health/checks.ts:104 |
