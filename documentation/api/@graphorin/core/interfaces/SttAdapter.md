[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SttAdapter

# Interface: SttAdapter

Defined in: [packages/core/src/contracts/stt.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/stt.ts#L49)

Pluggable speech-to-text engine.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Stable engine id for audit rows, e.g. `'faster-whisper'`. | [packages/core/src/contracts/stt.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/stt.ts#L51) |

## Methods

### transcribe()

```ts
transcribe(request): Promise<SttTranscript>;
```

Defined in: [packages/core/src/contracts/stt.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/stt.ts#L52)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`SttTranscriptionRequest`](/api/@graphorin/core/interfaces/SttTranscriptionRequest.md) |

#### Returns

`Promise`\&lt;[`SttTranscript`](/api/@graphorin/core/interfaces/SttTranscript.md)\&gt;
