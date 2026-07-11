[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / isValidatedExporter

# Function: isValidatedExporter()

```ts
function isValidatedExporter(exporter): boolean;
```

Defined in: [packages/observability/src/exporters/with-validation.ts:202](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/exporters/with-validation.ts#L202)

Quickly check whether an exporter is the result of a previous
[withValidation](/api/@graphorin/observability/functions/withValidation.md) call. The tracer uses this to fail fast at
startup.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `exporter` | [`TraceExporter`](/api/@graphorin/observability/interfaces/TraceExporter.md) |

## Returns

`boolean`

## Stable
