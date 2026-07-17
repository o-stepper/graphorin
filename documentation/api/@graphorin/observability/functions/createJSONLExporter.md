[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / createJSONLExporter

# Function: createJSONLExporter()

```ts
function createJSONLExporter(opts): JSONLExporter;
```

Defined in: [packages/observability/src/exporters/jsonl.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/exporters/jsonl.ts#L75)

Build a JSONL trace exporter. Call `withValidation(exporter)` before
passing the result to `createTracer({ exporters })`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`JSONLExporterOptions`](/api/@graphorin/observability/interfaces/JSONLExporterOptions.md) |

## Returns

`JSONLExporter`

## Stable
