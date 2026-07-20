[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / createConsoleExporter

# Function: createConsoleExporter()

```ts
function createConsoleExporter(opts?): TraceExporter;
```

Defined in: packages/observability/src/exporters/console.ts:33

**`Stable`**

Build a console-based trace exporter. Call `withValidation(exporter)`
before passing the result to `createTracer({ exporters })`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`ConsoleExporterOptions`](/api/@graphorin/observability/interfaces/ConsoleExporterOptions.md) |

## Returns

[`TraceExporter`](/api/@graphorin/observability/interfaces/TraceExporter.md)
