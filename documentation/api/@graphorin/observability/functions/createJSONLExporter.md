[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / createJSONLExporter

# Function: createJSONLExporter()

```ts
function createJSONLExporter(opts): TraceExporter;
```

Defined in: packages/observability/src/exporters/jsonl.ts:58

Build a JSONL trace exporter. Call `withValidation(exporter)` before
passing the result to `createTracer({ exporters })`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`JSONLExporterOptions`](/api/@graphorin/observability/interfaces/JSONLExporterOptions.md) |

## Returns

[`TraceExporter`](/api/@graphorin/observability/interfaces/TraceExporter.md)

## Stable
