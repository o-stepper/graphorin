[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ConsolidatorCheck

# Interface: ConsolidatorCheck

Defined in: packages/server/src/health/checks.ts:70

## Stable

## Extends

- [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md)

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-budgetremaining"></a> `budgetRemaining` | `readonly` | \{ `costUsd`: `number`; `tokens`: `number`; \} | - | packages/server/src/health/checks.ts:76 |
| `budgetRemaining.costUsd` | `readonly` | `number` | - | packages/server/src/health/checks.ts:78 |
| `budgetRemaining.tokens` | `readonly` | `number` | - | packages/server/src/health/checks.ts:77 |
| <a id="property-dlqsize"></a> `dlqSize` | `readonly` | `number` | - | packages/server/src/health/checks.ts:75 |
| <a id="property-message"></a> `message?` | `readonly` | `string` | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`message`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-message) | packages/server/src/health/checks.ts:42 |
| <a id="property-paused"></a> `paused` | `readonly` | `boolean` | - | packages/server/src/health/checks.ts:73 |
| <a id="property-queuedepth"></a> `queueDepth` | `readonly` | `number` | - | packages/server/src/health/checks.ts:74 |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | - | packages/server/src/health/checks.ts:72 |
| <a id="property-status"></a> `status` | `readonly` | [`HealthStatus`](/api/@graphorin/server/type-aliases/HealthStatus.md) | [`BaseHealthCheck`](/api/@graphorin/server/interfaces/BaseHealthCheck.md).[`status`](/api/@graphorin/server/interfaces/BaseHealthCheck.md#property-status) | packages/server/src/health/checks.ts:41 |
| <a id="property-tier"></a> `tier` | `readonly` | `string` | - | packages/server/src/health/checks.ts:71 |
