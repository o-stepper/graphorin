[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SttAdapter

# Interface: SttAdapter

Defined in: packages/core/src/contracts/stt.ts:49

**`Stable`**

Pluggable speech-to-text engine.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Stable engine id for audit rows, e.g. `'faster-whisper'`. | packages/core/src/contracts/stt.ts:51 |

## Methods

### transcribe()

```ts
transcribe(request): Promise<SttTranscript>;
```

Defined in: packages/core/src/contracts/stt.ts:52

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`SttTranscriptionRequest`](/api/@graphorin/core/interfaces/SttTranscriptionRequest.md) |

#### Returns

`Promise`\&lt;[`SttTranscript`](/api/@graphorin/core/interfaces/SttTranscript.md)\&gt;
