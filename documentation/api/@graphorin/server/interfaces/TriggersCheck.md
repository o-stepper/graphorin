[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / TriggersCheck

# Interface: TriggersCheck

Defined in: packages/server/src/health/checks.ts:85

**`Stable`**

## Extends

- [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-active"></a> `active` | `readonly` | `number` | - | - | packages/server/src/health/checks.ts:87 |
| <a id="property-deferred"></a> `deferred` | `readonly` | `number` | - | - | packages/server/src/health/checks.ts:89 |
| <a id="property-disabled"></a> `disabled` | `readonly` | `number` | - | - | packages/server/src/health/checks.ts:88 |
| <a id="property-lastfireat"></a> `lastFireAt?` | `readonly` | `string` | - | - | packages/server/src/health/checks.ts:97 |
| <a id="property-message"></a> `message?` | `readonly` | `string` | - | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`message`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-message) | packages/server/src/health/checks.ts:44 |
| <a id="property-orphaned"></a> `orphaned` | `readonly` | `number` | Count of persisted triggers whose declaration is not registered in this process (they will never fire until re-registered or pruned). The daemon status already exposes this; the health check now surfaces it too. | - | packages/server/src/health/checks.ts:96 |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | - | - | packages/server/src/health/checks.ts:86 |
| <a id="property-status"></a> `status` | `readonly` | [`HealthStatus`](/api/@graphorin/server/type-aliases/HealthStatus.md) | - | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`status`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-status) | packages/server/src/health/checks.ts:43 |
