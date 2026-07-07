[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / StorageCheck

# Interface: StorageCheck

Defined in: [packages/server/src/health/checks.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L47)

## Stable

## Extends

- [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-lastcheckpointat"></a> `lastCheckpointAt?` | `readonly` | `string` | - | [packages/server/src/health/checks.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L50) |
| <a id="property-message"></a> `message?` | `readonly` | `string` | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`message`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-message) | [packages/server/src/health/checks.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L43) |
| <a id="property-status"></a> `status` | `readonly` | [`HealthStatus`](/api/@graphorin/server/type-aliases/HealthStatus.md) | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`status`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-status) | [packages/server/src/health/checks.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L42) |
| <a id="property-walsizebytes"></a> `walSizeBytes` | `readonly` | `number` | - | [packages/server/src/health/checks.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L48) |
| <a id="property-warnthresholdbytes"></a> `warnThresholdBytes` | `readonly` | `number` | - | [packages/server/src/health/checks.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L49) |
