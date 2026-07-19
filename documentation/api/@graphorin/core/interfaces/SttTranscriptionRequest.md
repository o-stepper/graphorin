[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SttTranscriptionRequest

# Interface: SttTranscriptionRequest

Defined in: packages/core/src/contracts/stt.ts:13

**`Stable`**

Speech-to-text seam. The canonical adapter name is `SttAdapter`;
this single definition is consumed by the channel gateway
(`@graphorin/channels`, voice notes) and by any future voice
pipeline, so the two can never diverge on the contract.

The framework ships NO implementations - engines (whisper.cpp,
faster-whisper, cloud APIs) live in application repositories or
opt-in packages.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-audio"></a> `audio` | `readonly` | `Uint8Array` | Raw audio bytes as received from the channel. | packages/core/src/contracts/stt.ts:15 |
| <a id="property-languagehint"></a> `languageHint?` | `readonly` | `string` | Optional BCP-47 language hint, e.g. `'ru'`. | packages/core/src/contracts/stt.ts:19 |
| <a id="property-mimetype"></a> `mimeType` | `readonly` | `string` | MIME type of `audio`, e.g. `'audio/ogg'`. | packages/core/src/contracts/stt.ts:17 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/core/src/contracts/stt.ts:20 |
