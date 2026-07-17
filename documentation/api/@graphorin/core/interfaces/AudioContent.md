[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AudioContent

# Interface: AudioContent

Defined in: [packages/core/src/types/message.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L58)

Audio attachment (e.g. voice messages). Note: voice realtime / TTS / STT
are out of scope for v0.1 - these messages are static blobs.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-audio"></a> `audio` | `readonly` | `Uint8Array`\&lt;`ArrayBufferLike`\&gt; \| `URL` | - | [packages/core/src/types/message.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L60) |
| <a id="property-causalitychain"></a> `causalityChain?` | `readonly` | readonly `string`[] | See [TextContent.causalityChain](/api/@graphorin/core/interfaces/TextContent.md#property-causalitychain). | [packages/core/src/types/message.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L63) |
| <a id="property-mimetype"></a> `mimeType?` | `readonly` | `string` | - | [packages/core/src/types/message.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L61) |
| <a id="property-type"></a> `type` | `readonly` | `"audio"` | - | [packages/core/src/types/message.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L59) |
