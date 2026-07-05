[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / TraceExporter

# Interface: TraceExporter

Defined in: packages/observability/src/exporters/types.ts:62

A trace exporter contract. Exporters consume a stream of finished
spans and forward them to a sink (console, file, OTLP wire, …).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-validated_exporter_brand"></a> `[VALIDATED_EXPORTER_BRAND]?` | `readonly` | `true` | **`Internal`** Branded-marker stub. Set by `withValidation(...)` to signal that the exporter has been wrapped. Direct exporters omit the brand and the tracer fails fast at startup. | packages/observability/src/exporters/types.ts:77 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/observability/src/exporters/types.ts:63 |

## Methods

### export()

```ts
export(record): Promise<void>;
```

Defined in: packages/observability/src/exporters/types.ts:65

Forward a finished span record. Implementations should be cheap.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`SpanRecord`](/api/@graphorin/observability/interfaces/SpanRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### flush()

```ts
flush(): Promise<void>;
```

Defined in: packages/observability/src/exporters/types.ts:67

Flush any buffered spans. Called on `tracer.shutdown()`.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### shutdown()

```ts
shutdown(): Promise<void>;
```

Defined in: packages/observability/src/exporters/types.ts:69

Close any underlying resources. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;
