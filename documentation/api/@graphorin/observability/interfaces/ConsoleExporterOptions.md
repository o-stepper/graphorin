[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / ConsoleExporterOptions

# Interface: ConsoleExporterOptions

Defined in: [packages/observability/src/exporters/console.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/exporters/console.ts#L18)

Configuration shape for [createConsoleExporter](/api/@graphorin/observability/functions/createConsoleExporter.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id?` | `readonly` | `string` | Identifier reported via `exporter.id`. Defaults to `'console'`. | [packages/observability/src/exporters/console.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/exporters/console.ts#L20) |
| <a id="property-pretty"></a> `pretty?` | `readonly` | `boolean` | When `true`, emit JSON pretty-printed across multiple lines. | [packages/observability/src/exporters/console.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/exporters/console.ts#L22) |
| <a id="property-sink"></a> `sink?` | `readonly` | (`line`) => `void` | Custom sink. Defaults to `console.log`. | [packages/observability/src/exporters/console.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/exporters/console.ts#L24) |
