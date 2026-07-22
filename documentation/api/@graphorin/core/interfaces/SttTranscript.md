[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SttTranscript

# Interface: SttTranscript

Defined in: packages/core/src/contracts/stt.ts:32

**`Stable`**

A finished transcription. `trustClass` is pinned to
`'channel-inbound'` by the type: a transcript of a voice note is
message-borne channel content and MUST inherit the channel trust
boundary (sanitization + taint), no matter which engine produced
it.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-confidence"></a> `confidence?` | `readonly` | `number` | Engine confidence in [0, 1], when reported. | packages/core/src/contracts/stt.ts:37 |
| <a id="property-durationms"></a> `durationMs?` | `readonly` | `number` | Source audio duration, when known. | packages/core/src/contracts/stt.ts:39 |
| <a id="property-language"></a> `language?` | `readonly` | `string` | Detected BCP-47 language, when the engine reports one. | packages/core/src/contracts/stt.ts:35 |
| <a id="property-text"></a> `text` | `readonly` | `string` | - | packages/core/src/contracts/stt.ts:33 |
| <a id="property-trustclass"></a> `trustClass` | `readonly` | `"channel-inbound"` | Provenance pin - see the interface docs. | packages/core/src/contracts/stt.ts:41 |
