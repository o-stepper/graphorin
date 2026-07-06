[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / SpanRecord

# Interface: SpanRecord\<T\>

Defined in: packages/observability/src/exporters/types.ts:27

Sanitized, JSON-serialisable representation of a finished span. The
exporters never see the live OTel span; the tracer materialises this
record once the span ends and runs it through the validator.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) | [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-attributes"></a> `attributes` | `readonly` | [`SpanAttributes`](/api/@graphorin/core/type-aliases/SpanAttributes.md) | - | packages/observability/src/exporters/types.ts:37 |
| <a id="property-droppedreason"></a> `droppedReason?` | `readonly` | `string` | Set when the validator dropped the span entirely (replay marker). | packages/observability/src/exporters/types.ts:42 |
| <a id="property-endunixnano"></a> `endUnixNano` | `readonly` | `number` | - | packages/observability/src/exporters/types.ts:34 |
| <a id="property-events"></a> `events` | `readonly` | readonly [`SpanRecordEvent`](/api/@graphorin/observability/interfaces/SpanRecordEvent.md)[] | - | packages/observability/src/exporters/types.ts:38 |
| <a id="property-id"></a> `id` | `readonly` | `string` | - | packages/observability/src/exporters/types.ts:29 |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | packages/observability/src/exporters/types.ts:32 |
| <a id="property-parentid"></a> `parentId?` | `readonly` | `string` | - | packages/observability/src/exporters/types.ts:31 |
| <a id="property-sensitivitybyattribute"></a> `sensitivityByAttribute?` | `readonly` | `Readonly`\<`Record`\<`string`, [`SpanAttributeValue`](/api/@graphorin/core/type-aliases/SpanAttributeValue.md)\>\> | Optional per-attribute sensitivity map - see `setAttribute({ sensitivity })`. | packages/observability/src/exporters/types.ts:40 |
| <a id="property-startunixnano"></a> `startUnixNano` | `readonly` | `number` | - | packages/observability/src/exporters/types.ts:33 |
| <a id="property-status"></a> `status` | `readonly` | [`SpanStatus`](/api/@graphorin/core/type-aliases/SpanStatus.md) | - | packages/observability/src/exporters/types.ts:35 |
| <a id="property-statusmessage"></a> `statusMessage?` | `readonly` | `string` | - | packages/observability/src/exporters/types.ts:36 |
| <a id="property-traceid"></a> `traceId` | `readonly` | `string` | - | packages/observability/src/exporters/types.ts:30 |
| <a id="property-type"></a> `type` | `readonly` | `T` | - | packages/observability/src/exporters/types.ts:28 |
