[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / FileGeneratedEvent

# Interface: FileGeneratedEvent

Defined in: packages/core/src/types/agent-event.ts:295

**`Stable`**

A provider-generated file surfaced from the model stream -
previously these `'file'` provider events were silently dropped.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-data"></a> `data` | `readonly` | `Uint8Array` | packages/core/src/types/agent-event.ts:298 |
| <a id="property-mimetype"></a> `mimeType` | `readonly` | `string` | packages/core/src/types/agent-event.ts:297 |
| <a id="property-type"></a> `type` | `readonly` | `"file.generated"` | packages/core/src/types/agent-event.ts:296 |
