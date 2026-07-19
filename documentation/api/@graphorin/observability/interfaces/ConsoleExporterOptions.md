[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / ConsoleExporterOptions

# Interface: ConsoleExporterOptions

Defined in: packages/observability/src/exporters/console.ts:18

**`Stable`**

Configuration shape for [createConsoleExporter](/api/@graphorin/observability/functions/createConsoleExporter.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id?` | `readonly` | `string` | Identifier reported via `exporter.id`. Defaults to `'console'`. | packages/observability/src/exporters/console.ts:20 |
| <a id="property-pretty"></a> `pretty?` | `readonly` | `boolean` | When `true`, emit JSON pretty-printed across multiple lines. | packages/observability/src/exporters/console.ts:22 |
| <a id="property-sink"></a> `sink?` | `readonly` | (`line`) => `void` | Custom sink. Defaults to `console.log`. | packages/observability/src/exporters/console.ts:24 |
