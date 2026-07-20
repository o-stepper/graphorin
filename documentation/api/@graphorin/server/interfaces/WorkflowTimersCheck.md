[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WorkflowTimersCheck

# Interface: WorkflowTimersCheck

Defined in: packages/server/src/health/checks.ts:133

**`Stable`**

Durable-timer driver health.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-errors"></a> `errors` | `readonly` | `number` | packages/server/src/health/checks.ts:138 |
| <a id="property-fired"></a> `fired` | `readonly` | `number` | packages/server/src/health/checks.ts:137 |
| <a id="property-lastsweepat"></a> `lastSweepAt?` | `readonly` | `string` | packages/server/src/health/checks.ts:139 |
| <a id="property-message"></a> `message?` | `readonly` | `string` | packages/server/src/health/checks.ts:141 |
| <a id="property-nextwakeat"></a> `nextWakeAt?` | `readonly` | `string` | packages/server/src/health/checks.ts:140 |
| <a id="property-running"></a> `running` | `readonly` | `boolean` | packages/server/src/health/checks.ts:135 |
| <a id="property-status"></a> `status` | `readonly` | [`HealthStatus`](/api/@graphorin/server/type-aliases/HealthStatus.md) | packages/server/src/health/checks.ts:134 |
| <a id="property-sweeps"></a> `sweeps` | `readonly` | `number` | packages/server/src/health/checks.ts:136 |
