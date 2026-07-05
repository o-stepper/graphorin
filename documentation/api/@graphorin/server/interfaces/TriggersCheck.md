[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / TriggersCheck

# Interface: TriggersCheck

Defined in: packages/server/src/health/checks.ts:83

## Stable

## Extends

- [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-active"></a> `active` | `readonly` | `number` | - | packages/server/src/health/checks.ts:85 |
| <a id="property-deferred"></a> `deferred` | `readonly` | `number` | - | packages/server/src/health/checks.ts:87 |
| <a id="property-disabled"></a> `disabled` | `readonly` | `number` | - | packages/server/src/health/checks.ts:86 |
| <a id="property-lastfireat"></a> `lastFireAt?` | `readonly` | `string` | - | packages/server/src/health/checks.ts:88 |
| <a id="property-message"></a> `message?` | `readonly` | `string` | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`message`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-message) | packages/server/src/health/checks.ts:42 |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | - | packages/server/src/health/checks.ts:84 |
| <a id="property-status"></a> `status` | `readonly` | [`HealthStatus`](/api/@graphorin/server/type-aliases/HealthStatus.md) | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`status`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-status) | packages/server/src/health/checks.ts:41 |
