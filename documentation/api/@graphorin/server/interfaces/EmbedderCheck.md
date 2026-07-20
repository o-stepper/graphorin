[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / EmbedderCheck

# Interface: EmbedderCheck

Defined in: packages/server/src/health/checks.ts:55

**`Stable`**

## Extends

- [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-message"></a> `message?` | `readonly` | `string` | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`message`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-message) | packages/server/src/health/checks.ts:44 |
| <a id="property-model"></a> `model?` | `readonly` | `string` | - | packages/server/src/health/checks.ts:57 |
| <a id="property-modelloaded"></a> `modelLoaded` | `readonly` | `boolean` | - | packages/server/src/health/checks.ts:56 |
| <a id="property-status"></a> `status` | `readonly` | [`HealthStatus`](/api/@graphorin/server/type-aliases/HealthStatus.md) | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`status`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-status) | packages/server/src/health/checks.ts:43 |
