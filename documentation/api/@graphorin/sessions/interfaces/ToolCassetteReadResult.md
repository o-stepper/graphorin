[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ToolCassetteReadResult

# Interface: ToolCassetteReadResult

Defined in: [packages/sessions/src/cassette/reader.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/reader.ts#L37)

Read result.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-footer"></a> `footer` | `readonly` | [`ToolCassetteFooterRecord`](/api/@graphorin/sessions/interfaces/ToolCassetteFooterRecord.md) | [packages/sessions/src/cassette/reader.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/reader.ts#L41) |
| <a id="property-meta"></a> `meta` | `readonly` | [`ToolCassetteMetaRecord`](/api/@graphorin/sessions/interfaces/ToolCassetteMetaRecord.md) | [packages/sessions/src/cassette/reader.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/reader.ts#L38) |
| <a id="property-records"></a> `records` | `readonly` | readonly [`ToolCassetteParsedRecord`](/api/@graphorin/sessions/type-aliases/ToolCassetteParsedRecord.md)[] | [packages/sessions/src/cassette/reader.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/reader.ts#L39) |
| <a id="property-toolcalls"></a> `toolCalls` | `readonly` | readonly [`ToolCallRecord`](/api/@graphorin/sessions/interfaces/ToolCallRecord.md)[] | [packages/sessions/src/cassette/reader.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/reader.ts#L40) |
| <a id="property-warnings"></a> `warnings` | `readonly` | readonly \{ `kind`: `"unknown-record"` \| `"schema-future-minor"`; `message`: `string`; \}[] | [packages/sessions/src/cassette/reader.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/reader.ts#L42) |
