[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ReplayBufferCheck

# Interface: ReplayBufferCheck

Defined in: packages/server/src/health/checks.ts:92

## Stable

## Extends

- [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-eventsbuffered"></a> `eventsBuffered` | `readonly` | `number` | - | packages/server/src/health/checks.ts:93 |
| <a id="property-message"></a> `message?` | `readonly` | `string` | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`message`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-message) | packages/server/src/health/checks.ts:42 |
| <a id="property-status"></a> `status` | `readonly` | [`HealthStatus`](/api/@graphorin/server/type-aliases/HealthStatus.md) | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`status`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-status) | packages/server/src/health/checks.ts:41 |
| <a id="property-subscribers"></a> `subscribers?` | `readonly` | `number` | - | packages/server/src/health/checks.ts:94 |
| <a id="property-subscriptions"></a> `subscriptions?` | `readonly` | `number` | - | packages/server/src/health/checks.ts:95 |
