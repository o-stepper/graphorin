[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / OTLPHttpExporterOptions

# Interface: OTLPHttpExporterOptions

Defined in: packages/observability/src/exporters/otlp-http.ts:30

**`Stable`**

Configuration shape for [createOTLPHttpExporter](/api/@graphorin/observability/functions/createOTLPHttpExporter.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-fetchimpl"></a> `fetchImpl?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | Optional `fetch` override - useful for testing without the network. | packages/observability/src/exporters/otlp-http.ts:40 |
| <a id="property-headers"></a> `headers?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | Optional headers (auth, tenant id, …). Avoid passing secrets in plain. | packages/observability/src/exporters/otlp-http.ts:36 |
| <a id="property-id"></a> `id?` | `readonly` | `string` | Identifier reported via `exporter.id`. Defaults to `'otlp-http'`. | packages/observability/src/exporters/otlp-http.ts:32 |
| <a id="property-servicename"></a> `serviceName?` | `readonly` | `string` | Service name embedded in the OTLP `Resource`. | packages/observability/src/exporters/otlp-http.ts:38 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Optional timeout (ms). Defaults to 10000. | packages/observability/src/exporters/otlp-http.ts:42 |
| <a id="property-url"></a> `url` | `readonly` | `string` | OTLP collector URL (e.g. `http://localhost:4318/v1/traces`). | packages/observability/src/exporters/otlp-http.ts:34 |
