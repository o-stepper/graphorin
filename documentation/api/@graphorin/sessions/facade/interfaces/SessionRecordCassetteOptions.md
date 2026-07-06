[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [facade](/api/@graphorin/sessions/facade/index.md) / SessionRecordCassetteOptions

# Interface: SessionRecordCassetteOptions

Defined in: packages/sessions/src/facade.ts:280

Options accepted by `Session.recordToolCassette({...})`.

## Stable

## Extends

- `Omit`\&lt;[`ToolCassetteRecorderOptions`](/api/@graphorin/sessions/interfaces/ToolCassetteRecorderOptions.md), `"sessionId"` \| `"runId"` \| `"writer"`\&gt;

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-hash"></a> `hash?` | `readonly` | `boolean` | - | [`ToolCassetteRecorderOptions`](/api/@graphorin/sessions/interfaces/ToolCassetteRecorderOptions.md).[`hash`](/api/@graphorin/sessions/interfaces/ToolCassetteRecorderOptions.md#property-hash) | packages/sessions/src/cassette/writer.ts:42 |
| <a id="property-includeartifacts"></a> `includeArtifacts?` | `readonly` | `boolean` | When `true`, the recorder copies content-part artifacts. | [`ToolCassetteRecorderOptions`](/api/@graphorin/sessions/interfaces/ToolCassetteRecorderOptions.md).[`includeArtifacts`](/api/@graphorin/sessions/interfaces/ToolCassetteRecorderOptions.md#property-includeartifacts) | packages/sessions/src/cassette/recorder.ts:41 |
| <a id="property-minruntimeversion"></a> `minRuntimeVersion?` | `readonly` | `string` | - | [`ToolCassetteRecorderOptions`](/api/@graphorin/sessions/interfaces/ToolCassetteRecorderOptions.md).[`minRuntimeVersion`](/api/@graphorin/sessions/interfaces/ToolCassetteRecorderOptions.md#property-minruntimeversion) | packages/sessions/src/cassette/writer.ts:40 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | - | [`ToolCassetteRecorderOptions`](/api/@graphorin/sessions/interfaces/ToolCassetteRecorderOptions.md).[`now`](/api/@graphorin/sessions/interfaces/ToolCassetteRecorderOptions.md#property-now) | packages/sessions/src/cassette/writer.ts:43 |
| <a id="property-outputpath"></a> `outputPath?` | `readonly` | `string` | Filesystem path the cassette is destined for (used by `flushToFile`). | [`ToolCassetteRecorderOptions`](/api/@graphorin/sessions/interfaces/ToolCassetteRecorderOptions.md).[`outputPath`](/api/@graphorin/sessions/interfaces/ToolCassetteRecorderOptions.md#property-outputpath) | packages/sessions/src/cassette/recorder.ts:43 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | - | - | packages/sessions/src/facade.ts:282 |
| <a id="property-schemaurl"></a> `schemaUrl?` | `readonly` | `string` | - | [`ToolCassetteRecorderOptions`](/api/@graphorin/sessions/interfaces/ToolCassetteRecorderOptions.md).[`schemaUrl`](/api/@graphorin/sessions/interfaces/ToolCassetteRecorderOptions.md#property-schemaurl) | packages/sessions/src/cassette/writer.ts:41 |
| <a id="property-writer"></a> `writer?` | `readonly` | `string` | - | - | packages/sessions/src/facade.ts:283 |
