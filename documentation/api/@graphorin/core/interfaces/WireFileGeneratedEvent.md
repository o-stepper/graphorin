[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireFileGeneratedEvent

# Interface: WireFileGeneratedEvent

Defined in: packages/core/src/types/agent-event-wire.ts:43

Wire twin of FileGeneratedEvent.

## Stable

## Extends

- `Omit`\<`FileGeneratedEvent`, `"data"`\>

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-data"></a> `data` | `readonly` | [`EncodedBytes`](/api/@graphorin/core/interfaces/EncodedBytes.md) | - | packages/core/src/types/agent-event-wire.ts:44 |
| <a id="property-mimetype"></a> `mimeType` | `readonly` | `string` | `Omit.mimeType` | packages/core/src/types/agent-event.ts:266 |
| <a id="property-type"></a> `type` | `readonly` | `"file.generated"` | `Omit.type` | packages/core/src/types/agent-event.ts:265 |
