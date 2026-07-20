[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / FileResultReaderOptions

# Interface: FileResultReaderOptions

Defined in: packages/tools/src/result/reader.ts:94

Configuration for [createFileResultReader](/api/@graphorin/tools/functions/createFileResultReader.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-artifactroot"></a> `artifactRoot` | `readonly` | `string` | Root the spill writer writes under (e.g. `SpillWriter.artifactRoot`). | packages/tools/src/result/reader.ts:96 |
| <a id="property-maxbytes"></a> `maxBytes?` | `readonly` | `number` | Default `maxBytes` when the caller omits one. Default `65536`. | packages/tools/src/result/reader.ts:98 |
