[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / createOTLPHttpExporter

# Function: createOTLPHttpExporter()

```ts
function createOTLPHttpExporter(opts): TraceExporter;
```

Defined in: packages/observability/src/exporters/otlp-http.ts:56

**`Stable`**

Build a minimal OTLP-over-HTTP trace exporter. Call
`withValidation(exporter)` before passing the result to
`createTracer({ exporters })`.

The implementation issues one `POST` per finished span - no
batching. Operators wanting batching should wrap this exporter
with their own queue or use a sidecar collector.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`OTLPHttpExporterOptions`](/api/@graphorin/observability/interfaces/OTLPHttpExporterOptions.md) |

## Returns

[`TraceExporter`](/api/@graphorin/observability/interfaces/TraceExporter.md)
