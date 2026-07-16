[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ConsolidatorCheck

# Interface: ConsolidatorCheck

Defined in: [packages/server/src/health/checks.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L72)

## Stable

## Extends

- [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-budgetremaining"></a> `budgetRemaining` | `readonly` | \{ `costUsd`: `number`; `tokens`: `number`; \} | - | [packages/server/src/health/checks.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L78) |
| `budgetRemaining.costUsd` | `readonly` | `number` | - | [packages/server/src/health/checks.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L80) |
| `budgetRemaining.tokens` | `readonly` | `number` | - | [packages/server/src/health/checks.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L79) |
| <a id="property-dlqsize"></a> `dlqSize` | `readonly` | `number` | - | [packages/server/src/health/checks.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L77) |
| <a id="property-message"></a> `message?` | `readonly` | `string` | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`message`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-message) | [packages/server/src/health/checks.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L44) |
| <a id="property-paused"></a> `paused` | `readonly` | `boolean` | - | [packages/server/src/health/checks.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L75) |
| <a id="property-queuedepth"></a> `queueDepth` | `readonly` | `number` | - | [packages/server/src/health/checks.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L76) |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | - | [packages/server/src/health/checks.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L74) |
| <a id="property-status"></a> `status` | `readonly` | [`HealthStatus`](/api/@graphorin/server/type-aliases/HealthStatus.md) | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`status`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-status) | [packages/server/src/health/checks.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L43) |
| <a id="property-tier"></a> `tier` | `readonly` | `string` | - | [packages/server/src/health/checks.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L73) |
