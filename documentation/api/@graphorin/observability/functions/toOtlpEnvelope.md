[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / toOtlpEnvelope

# Function: toOtlpEnvelope()

```ts
function toOtlpEnvelope(record, serviceName): unknown;
```

Defined in: [packages/observability/src/exporters/otlp-http.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/exporters/otlp-http.ts#L111)

Convert a finished [SpanRecord](/api/@graphorin/observability/interfaces/SpanRecord.md) into an OTLP-HTTP `resourceSpans`
envelope. Exposed (OBS-PRIC-01) so an upstream OTel SDK pipeline can adapt
Graphorin spans inside its own exporter, as the observability and migration
guides document.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`SpanRecord`](/api/@graphorin/observability/interfaces/SpanRecord.md) |
| `serviceName` | `string` |

## Returns

`unknown`

## Stable
