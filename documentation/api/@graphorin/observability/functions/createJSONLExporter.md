[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / createJSONLExporter

# Function: createJSONLExporter()

```ts
function createJSONLExporter(opts): JSONLExporter;
```

Defined in: packages/observability/src/exporters/jsonl.ts:75

**`Stable`**

Build a JSONL trace exporter. Call `withValidation(exporter)` before
passing the result to `createTracer({ exporters })`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`JSONLExporterOptions`](/api/@graphorin/observability/interfaces/JSONLExporterOptions.md) |

## Returns

[`JSONLExporter`](/api/@graphorin/observability/interfaces/JSONLExporter.md)
