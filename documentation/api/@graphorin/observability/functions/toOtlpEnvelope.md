[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / toOtlpEnvelope

# Function: toOtlpEnvelope()

```ts
function toOtlpEnvelope(record, serviceName): unknown;
```

Defined in: packages/observability/src/exporters/otlp-http.ts:111

**`Stable`**

Convert a finished [SpanRecord](/api/@graphorin/observability/interfaces/SpanRecord.md) into an OTLP-HTTP `resourceSpans`
envelope. Exposed so an upstream OTel SDK pipeline can adapt
Graphorin spans inside its own exporter, as the observability and migration
guides document.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`SpanRecord`](/api/@graphorin/observability/interfaces/SpanRecord.md) |
| `serviceName` | `string` |

## Returns

`unknown`
