[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / exporters

# exporters

Exporter surface for `@graphorin/observability`.

Every exporter MUST be wrapped via [withValidation](/api/@graphorin/observability/functions/withValidation.md) before it
is registered with the tracer. Un-wrapped exporters cause
`createTracer(...)` to throw at startup unless the operator opts
out explicitly with `validation: 'off'` (in which case a startup
WARN is logged).

## References

### ConsoleExporterOptions

Re-exports [ConsoleExporterOptions](/api/@graphorin/observability/interfaces/ConsoleExporterOptions.md)

***

### createConsoleExporter

Re-exports [createConsoleExporter](/api/@graphorin/observability/functions/createConsoleExporter.md)

***

### createJSONLExporter

Re-exports [createJSONLExporter](/api/@graphorin/observability/functions/createJSONLExporter.md)

***

### createOTLPHttpExporter

Re-exports [createOTLPHttpExporter](/api/@graphorin/observability/functions/createOTLPHttpExporter.md)

***

### DateProvider

Re-exports [DateProvider](/api/@graphorin/observability/type-aliases/DateProvider.md)

***

### isValidatedExporter

Re-exports [isValidatedExporter](/api/@graphorin/observability/functions/isValidatedExporter.md)

***

### JSONLExporter

Re-exports [JSONLExporter](/api/@graphorin/observability/interfaces/JSONLExporter.md)

***

### JSONLExporterOptions

Re-exports [JSONLExporterOptions](/api/@graphorin/observability/interfaces/JSONLExporterOptions.md)

***

### OTLPHttpExporterOptions

Re-exports [OTLPHttpExporterOptions](/api/@graphorin/observability/interfaces/OTLPHttpExporterOptions.md)

***

### SpanRecord

Re-exports [SpanRecord](/api/@graphorin/observability/interfaces/SpanRecord.md)

***

### SpanRecordEvent

Re-exports [SpanRecordEvent](/api/@graphorin/observability/interfaces/SpanRecordEvent.md)

***

### toOtlpEnvelope

Re-exports [toOtlpEnvelope](/api/@graphorin/observability/functions/toOtlpEnvelope.md)

***

### TraceExporter

Re-exports [TraceExporter](/api/@graphorin/observability/interfaces/TraceExporter.md)

***

### tryGetValidatorCounters

Re-exports [tryGetValidatorCounters](/api/@graphorin/observability/functions/tryGetValidatorCounters.md)

***

### VALIDATED\_EXPORTER\_BRAND

Re-exports [VALIDATED_EXPORTER_BRAND](/api/@graphorin/observability/variables/VALIDATED_EXPORTER_BRAND.md)

***

### withValidation

Re-exports [withValidation](/api/@graphorin/observability/functions/withValidation.md)

***

### WithValidationOptions

Re-exports [WithValidationOptions](/api/@graphorin/observability/interfaces/WithValidationOptions.md)
