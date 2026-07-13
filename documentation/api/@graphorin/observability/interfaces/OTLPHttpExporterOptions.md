[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / OTLPHttpExporterOptions

# Interface: OTLPHttpExporterOptions

Defined in: [packages/observability/src/exporters/otlp-http.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/exporters/otlp-http.ts#L30)

Configuration shape for [createOTLPHttpExporter](/api/@graphorin/observability/functions/createOTLPHttpExporter.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-fetchimpl"></a> `fetchImpl?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | Optional `fetch` override - useful for testing without the network. | [packages/observability/src/exporters/otlp-http.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/exporters/otlp-http.ts#L40) |
| <a id="property-headers"></a> `headers?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | Optional headers (auth, tenant id, …). Avoid passing secrets in plain. | [packages/observability/src/exporters/otlp-http.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/exporters/otlp-http.ts#L36) |
| <a id="property-id"></a> `id?` | `readonly` | `string` | Identifier reported via `exporter.id`. Defaults to `'otlp-http'`. | [packages/observability/src/exporters/otlp-http.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/exporters/otlp-http.ts#L32) |
| <a id="property-servicename"></a> `serviceName?` | `readonly` | `string` | Service name embedded in the OTLP `Resource`. | [packages/observability/src/exporters/otlp-http.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/exporters/otlp-http.ts#L38) |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Optional timeout (ms). Defaults to 10000. | [packages/observability/src/exporters/otlp-http.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/exporters/otlp-http.ts#L42) |
| <a id="property-url"></a> `url` | `readonly` | `string` | OTLP collector URL (e.g. `http://localhost:4318/v1/traces`). | [packages/observability/src/exporters/otlp-http.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/exporters/otlp-http.ts#L34) |
