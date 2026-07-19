[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ToolCassetteRecorderOptions

# Interface: ToolCassetteRecorderOptions

Defined in: packages/sessions/src/cassette/recorder.ts:39

**`Stable`**

Options accepted by [createToolCassetteRecorder](/api/@graphorin/sessions/functions/createToolCassetteRecorder.md).

## Extends

- [`ToolCassetteWriterOptions`](/api/@graphorin/sessions/interfaces/ToolCassetteWriterOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-hash"></a> `hash?` | `readonly` | `boolean` | - | [`ToolCassetteWriterOptions`](/api/@graphorin/sessions/interfaces/ToolCassetteWriterOptions.md).[`hash`](/api/@graphorin/sessions/interfaces/ToolCassetteWriterOptions.md#property-hash) | packages/sessions/src/cassette/writer.ts:42 |
| <a id="property-includeartifacts"></a> `includeArtifacts?` | `readonly` | `boolean` | When `true`, the recorder copies content-part artifacts. | - | packages/sessions/src/cassette/recorder.ts:41 |
| <a id="property-minruntimeversion"></a> `minRuntimeVersion?` | `readonly` | `string` | - | [`ToolCassetteWriterOptions`](/api/@graphorin/sessions/interfaces/ToolCassetteWriterOptions.md).[`minRuntimeVersion`](/api/@graphorin/sessions/interfaces/ToolCassetteWriterOptions.md#property-minruntimeversion) | packages/sessions/src/cassette/writer.ts:40 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | - | [`ToolCassetteWriterOptions`](/api/@graphorin/sessions/interfaces/ToolCassetteWriterOptions.md).[`now`](/api/@graphorin/sessions/interfaces/ToolCassetteWriterOptions.md#property-now) | packages/sessions/src/cassette/writer.ts:43 |
| <a id="property-outputpath"></a> `outputPath?` | `readonly` | `string` | Filesystem path the cassette is destined for (used by `flushToFile`). | - | packages/sessions/src/cassette/recorder.ts:43 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | - | [`ToolCassetteWriterOptions`](/api/@graphorin/sessions/interfaces/ToolCassetteWriterOptions.md).[`runId`](/api/@graphorin/sessions/interfaces/ToolCassetteWriterOptions.md#property-runid) | packages/sessions/src/cassette/writer.ts:39 |
| <a id="property-schemaurl"></a> `schemaUrl?` | `readonly` | `string` | - | [`ToolCassetteWriterOptions`](/api/@graphorin/sessions/interfaces/ToolCassetteWriterOptions.md).[`schemaUrl`](/api/@graphorin/sessions/interfaces/ToolCassetteWriterOptions.md#property-schemaurl) | packages/sessions/src/cassette/writer.ts:41 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | [`ToolCassetteWriterOptions`](/api/@graphorin/sessions/interfaces/ToolCassetteWriterOptions.md).[`sessionId`](/api/@graphorin/sessions/interfaces/ToolCassetteWriterOptions.md#property-sessionid) | packages/sessions/src/cassette/writer.ts:38 |
| <a id="property-writer"></a> `writer` | `readonly` | `string` | - | [`ToolCassetteWriterOptions`](/api/@graphorin/sessions/interfaces/ToolCassetteWriterOptions.md).[`writer`](/api/@graphorin/sessions/interfaces/ToolCassetteWriterOptions.md#property-writer) | packages/sessions/src/cassette/writer.ts:37 |
