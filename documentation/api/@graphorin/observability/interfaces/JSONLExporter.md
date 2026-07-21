[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / JSONLExporter

# Interface: JSONLExporter

Defined in: packages/observability/src/exporters/jsonl.ts:64

**`Stable`**

A JSONL exporter, plus an introspection seam for the bounded handle pool.

## Extends

- [`TraceExporter`](/api/@graphorin/observability/interfaces/TraceExporter.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-validated_exporter_brand"></a> `[VALIDATED_EXPORTER_BRAND]?` | `readonly` | `true` | **`Internal`** Branded-marker stub. Set by `withValidation(...)` to signal that the exporter has been wrapped. Direct exporters omit the brand and the tracer fails fast at startup. | [`TraceExporter`](/api/@graphorin/observability/interfaces/TraceExporter.md).[`[VALIDATED_EXPORTER_BRAND]`](/api/@graphorin/observability/interfaces/TraceExporter.md#property-validated_exporter_brand) | packages/observability/src/exporters/types.ts:84 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | [`TraceExporter`](/api/@graphorin/observability/interfaces/TraceExporter.md).[`id`](/api/@graphorin/observability/interfaces/TraceExporter.md#property-id) | packages/observability/src/exporters/types.ts:70 |

## Methods

### export()

```ts
export(record): Promise<void>;
```

Defined in: packages/observability/src/exporters/types.ts:72

Forward a finished span record. Implementations should be cheap.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`SpanRecord`](/api/@graphorin/observability/interfaces/SpanRecord.md) |

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

[`TraceExporter`](/api/@graphorin/observability/interfaces/TraceExporter.md).[`export`](/api/@graphorin/observability/interfaces/TraceExporter.md#export)

***

### flush()

```ts
flush(): Promise<void>;
```

Defined in: packages/observability/src/exporters/types.ts:74

Flush any buffered spans. Called on `tracer.shutdown()`.

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

[`TraceExporter`](/api/@graphorin/observability/interfaces/TraceExporter.md).[`flush`](/api/@graphorin/observability/interfaces/TraceExporter.md#flush)

***

### openHandleCount()

```ts
openHandleCount(): number;
```

Defined in: packages/observability/src/exporters/jsonl.ts:66

Number of file handles currently open in the pool.

#### Returns

`number`

***

### shutdown()

```ts
shutdown(): Promise<void>;
```

Defined in: packages/observability/src/exporters/types.ts:76

Close any underlying resources. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

#### Inherited from

[`TraceExporter`](/api/@graphorin/observability/interfaces/TraceExporter.md).[`shutdown`](/api/@graphorin/observability/interfaces/TraceExporter.md#shutdown)
