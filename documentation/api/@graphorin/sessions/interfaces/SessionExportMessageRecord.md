[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportMessageRecord

# Interface: SessionExportMessageRecord

Defined in: [packages/sessions/src/export/types.ts:121](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L121)

Single message row. Carries the full `Message` shape (after
commentary-phase sanitization) plus storage metadata.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | [packages/sessions/src/export/types.ts:126](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L126) |
| <a id="property-embedderid"></a> `embedderId?` | `readonly` | `string` | Optional embedding metadata. The bytes themselves are NOT included - only the embedder id; importers re-compute embeddings locally if the embedder matches, or drop them under mismatch. | [packages/sessions/src/export/types.ts:136](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L136) |
| <a id="property-kind"></a> `kind` | `readonly` | `"message"` | - | [packages/sessions/src/export/types.ts:122](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L122) |
| <a id="property-message"></a> `message` | `readonly` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) | - | [packages/sessions/src/export/types.ts:130](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L130) |
| <a id="property-messageid"></a> `messageId` | `readonly` | `string` | - | [packages/sessions/src/export/types.ts:124](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L124) |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | `"public"` \| `"internal"` \| `"secret"` | - | [packages/sessions/src/export/types.ts:129](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L129) |
| <a id="property-sequence"></a> `sequence` | `readonly` | `number` | - | [packages/sessions/src/export/types.ts:125](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L125) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | [packages/sessions/src/export/types.ts:123](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L123) |
| <a id="property-tokencount"></a> `tokenCount?` | `readonly` | `number` | - | [packages/sessions/src/export/types.ts:127](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L127) |
| <a id="property-tokenizerversion"></a> `tokenizerVersion?` | `readonly` | `string` | - | [packages/sessions/src/export/types.ts:128](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L128) |
