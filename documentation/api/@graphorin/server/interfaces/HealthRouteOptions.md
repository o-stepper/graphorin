[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / HealthRouteOptions

# Interface: HealthRouteOptions

Defined in: packages/server/src/health/routes.ts:27

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | packages/server/src/health/routes.ts:30 |
| <a id="property-probes"></a> `probes` | `readonly` | () => \| [`HealthCheckOptions`](/api/@graphorin/server/interfaces/HealthCheckOptions.md) \| `Promise`\&lt;[`HealthCheckOptions`](/api/@graphorin/server/interfaces/HealthCheckOptions.md)\&gt; | packages/server/src/health/routes.ts:31 |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `number` | packages/server/src/health/routes.ts:29 |
| <a id="property-version"></a> `version` | `readonly` | `string` | packages/server/src/health/routes.ts:28 |
