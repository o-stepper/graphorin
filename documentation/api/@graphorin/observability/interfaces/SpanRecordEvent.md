[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / SpanRecordEvent

# Interface: SpanRecordEvent

Defined in: packages/observability/src/exporters/types.ts:50

**`Stable`**

Single span event carried alongside the span record.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-attributes"></a> `attributes` | `readonly` | [`SpanAttributes`](/api/@graphorin/core/type-aliases/SpanAttributes.md) | - | packages/observability/src/exporters/types.ts:53 |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | packages/observability/src/exporters/types.ts:51 |
| <a id="property-sensitivitybyattribute"></a> `sensitivityByAttribute?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `"public"` \| `"internal"` \| `"secret"`\&gt;\> | Per-attribute sensitivity map recorded by `addEvent(name, attrs, { sensitivity, sensitivityByAttribute })`. Consumed by the validation exporter; absent ⇒ every attribute is untagged (default-deny below the export floor). | packages/observability/src/exporters/types.ts:60 |
| <a id="property-timeunixnano"></a> `timeUnixNano` | `readonly` | `number` | - | packages/observability/src/exporters/types.ts:52 |
