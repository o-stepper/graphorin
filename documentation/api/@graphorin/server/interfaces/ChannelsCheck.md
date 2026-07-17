[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ChannelsCheck

# Interface: ChannelsCheck

Defined in: [packages/server/src/health/checks.ts:108](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L108)

B1.6: channel-gateway health.

## Stable

## Extends

- [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-channels"></a> `channels` | `readonly` | `number` | Number of registered channels (adapters). | - | [packages/server/src/health/checks.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L111) |
| <a id="property-dropped"></a> `dropped` | `readonly` | `number` | Messages shed on queue overflow since start (all channels). | - | [packages/server/src/health/checks.ts:115](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L115) |
| <a id="property-failed"></a> `failed` | `readonly` | `number` | Handler/pipeline failures since start (all channels). | - | [packages/server/src/health/checks.ts:117](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L117) |
| <a id="property-message"></a> `message?` | `readonly` | `string` | - | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`message`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-message) | [packages/server/src/health/checks.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L44) |
| <a id="property-queued"></a> `queued` | `readonly` | `number` | Messages currently queued across all channels. | - | [packages/server/src/health/checks.ts:113](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L113) |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | - | - | [packages/server/src/health/checks.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L109) |
| <a id="property-status"></a> `status` | `readonly` | [`HealthStatus`](/api/@graphorin/server/type-aliases/HealthStatus.md) | - | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`status`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-status) | [packages/server/src/health/checks.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L43) |
