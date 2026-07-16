[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireFileGeneratedEvent

# Interface: WireFileGeneratedEvent

Defined in: [packages/core/src/types/agent-event-wire.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event-wire.ts#L43)

Wire twin of `FileGeneratedEvent`.

## Stable

## Extends

- `Omit`\&lt;`FileGeneratedEvent`, `"data"`\&gt;

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-data"></a> `data` | `readonly` | [`EncodedBytes`](/api/@graphorin/core/interfaces/EncodedBytes.md) | - | [packages/core/src/types/agent-event-wire.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event-wire.ts#L44) |
| <a id="property-mimetype"></a> `mimeType` | `readonly` | `string` | `Omit.mimeType` | [packages/core/src/types/agent-event.ts:273](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L273) |
| <a id="property-type"></a> `type` | `readonly` | `"file.generated"` | `Omit.type` | [packages/core/src/types/agent-event.ts:272](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L272) |
