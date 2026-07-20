[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireFileGeneratedEvent

# Interface: WireFileGeneratedEvent

Defined in: packages/core/src/types/agent-event-wire.ts:43

**`Stable`**

Wire twin of `FileGeneratedEvent`.

## Extends

- `Omit`\&lt;[`FileGeneratedEvent`](/api/@graphorin/core/interfaces/FileGeneratedEvent.md), `"data"`\&gt;

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-data"></a> `data` | `readonly` | [`EncodedBytes`](/api/@graphorin/core/interfaces/EncodedBytes.md) | - | packages/core/src/types/agent-event-wire.ts:44 |
| <a id="property-mimetype"></a> `mimeType` | `readonly` | `string` | [`FileGeneratedEvent`](/api/@graphorin/core/interfaces/FileGeneratedEvent.md).[`mimeType`](/api/@graphorin/core/interfaces/FileGeneratedEvent.md#property-mimetype) | packages/core/src/types/agent-event.ts:297 |
| <a id="property-type"></a> `type` | `readonly` | `"file.generated"` | [`FileGeneratedEvent`](/api/@graphorin/core/interfaces/FileGeneratedEvent.md).[`type`](/api/@graphorin/core/interfaces/FileGeneratedEvent.md#property-type) | packages/core/src/types/agent-event.ts:296 |
