[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / EncryptionCheck

# Interface: EncryptionCheck

Defined in: [packages/server/src/health/checks.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L66)

## Stable

## Extends

- [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-enabled"></a> `enabled` | `readonly` | `boolean` | - | [packages/server/src/health/checks.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L67) |
| <a id="property-message"></a> `message?` | `readonly` | `string` | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`message`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-message) | [packages/server/src/health/checks.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L44) |
| <a id="property-peerdepinstalled"></a> `peerDepInstalled` | `readonly` | `boolean` | - | [packages/server/src/health/checks.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L68) |
| <a id="property-status"></a> `status` | `readonly` | [`HealthStatus`](/api/@graphorin/server/type-aliases/HealthStatus.md) | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`status`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-status) | [packages/server/src/health/checks.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L43) |
