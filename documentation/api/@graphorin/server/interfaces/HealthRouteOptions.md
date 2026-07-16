[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / HealthRouteOptions

# Interface: HealthRouteOptions

Defined in: [packages/server/src/health/routes.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/routes.ts#L27)

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | [packages/server/src/health/routes.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/routes.ts#L30) |
| <a id="property-probes"></a> `probes` | `readonly` | () => \| [`HealthCheckOptions`](/api/@graphorin/server/interfaces/HealthCheckOptions.md) \| `Promise`\&lt;[`HealthCheckOptions`](/api/@graphorin/server/interfaces/HealthCheckOptions.md)\&gt; | [packages/server/src/health/routes.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/routes.ts#L31) |
| <a id="property-startedat"></a> `startedAt` | `readonly` | `number` | [packages/server/src/health/routes.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/routes.ts#L29) |
| <a id="property-version"></a> `version` | `readonly` | `string` | [packages/server/src/health/routes.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/routes.ts#L28) |
