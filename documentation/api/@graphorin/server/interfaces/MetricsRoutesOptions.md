[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / MetricsRoutesOptions

# Interface: MetricsRoutesOptions

Defined in: packages/server/src/health/routes.ts:112

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-onerror"></a> `onError?` | `readonly` | (`err`) => `void` | - | packages/server/src/health/routes.ts:126 |
| <a id="property-refresh"></a> `refresh?` | `readonly` | () => `void` \| `Promise`\&lt;`void`\&gt; | Optional refresh callback invoked before every scrape. Use it to sample live signals (WAL size, in-flight runs, daemon status, replay buffer occupancy) into the registry so the scraped output reflects the moment of the request. Refresh failures are swallowed - a broken probe never blocks a Prometheus scrape - and surfaced through the optional `onError` sink. | packages/server/src/health/routes.ts:125 |
| <a id="property-registry"></a> `registry` | `readonly` | [`MetricRegistry`](/api/@graphorin/server/classes/MetricRegistry.md) | - | packages/server/src/health/routes.ts:113 |
| <a id="property-requireauth"></a> `requireAuth?` | `readonly` | `boolean` | - | packages/server/src/health/routes.ts:114 |
