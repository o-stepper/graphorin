[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / withValidation

# Function: withValidation()

```ts
function withValidation<E>(exporter, opts?): TraceExporter;
```

Defined in: packages/observability/src/exporters/with-validation.ts:43

**`Stable`**

Wrap an exporter so every span flows through a [RedactionValidator](/api/@graphorin/observability/interfaces/RedactionValidator.md)
before reaching the sink. Exporters that are not wrapped are rejected
by the tracer at startup.

## Type Parameters

| Type Parameter |
| ------ |
| `E` *extends* [`TraceExporter`](/api/@graphorin/observability/interfaces/TraceExporter.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `exporter` | `E` |
| `opts` | [`WithValidationOptions`](/api/@graphorin/observability/interfaces/WithValidationOptions.md) |

## Returns

[`TraceExporter`](/api/@graphorin/observability/interfaces/TraceExporter.md)
