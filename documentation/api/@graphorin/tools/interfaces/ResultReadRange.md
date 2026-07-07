[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ResultReadRange

# Interface: ResultReadRange

Defined in: [packages/tools/src/result/reader.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L34)

Range selector for [ResultReader.read](/api/@graphorin/tools/interfaces/ResultReader.md#read). A line range
(`startLine`/`endLine`, 1-based inclusive) takes precedence over a byte
range (`offset`/`length`) when both are supplied. `maxBytes` caps the
returned slice regardless of mode.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-endline"></a> `endLine?` | `readonly` | `number` | Last line to return, 1-based inclusive (line mode). | [packages/tools/src/result/reader.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L42) |
| <a id="property-length"></a> `length?` | `readonly` | `number` | Byte length to return (byte mode). Default: to end (subject to `maxBytes`). | [packages/tools/src/result/reader.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L38) |
| <a id="property-maxbytes"></a> `maxBytes?` | `readonly` | `number` | Hard cap on returned bytes. | [packages/tools/src/result/reader.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L44) |
| <a id="property-offset"></a> `offset?` | `readonly` | `number` | Byte offset into the artifact (byte mode). Default `0`. | [packages/tools/src/result/reader.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L36) |
| <a id="property-startline"></a> `startLine?` | `readonly` | `number` | First line to return, 1-based inclusive (line mode). | [packages/tools/src/result/reader.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L40) |
