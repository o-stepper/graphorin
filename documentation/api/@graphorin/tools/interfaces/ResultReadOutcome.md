[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ResultReadOutcome

# Interface: ResultReadOutcome

Defined in: packages/tools/src/result/reader.ts:50

Outcome of [ResultReader.read](/api/@graphorin/tools/interfaces/ResultReader.md#read).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-bytes"></a> `bytes` | `readonly` | `number` | Byte length of [content](/api/@graphorin/tools/interfaces/ResultReadOutcome.md#property-content). | packages/tools/src/result/reader.ts:54 |
| <a id="property-content"></a> `content` | `readonly` | `string` | The requested slice of the artifact. | packages/tools/src/result/reader.ts:52 |
| <a id="property-eof"></a> `eof` | `readonly` | `boolean` | `true` when [content](/api/@graphorin/tools/interfaces/ResultReadOutcome.md#property-content) reaches the end of the artifact (no more to read). | packages/tools/src/result/reader.ts:58 |
| <a id="property-producertrustclass"></a> `producerTrustClass?` | `readonly` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | Trust class of the producer of the resolved artifact, when the reader knows it (TL-6) — e.g. the MCP resource reader always reports `'mcp-derived'`. The executor re-applies inbound sanitization + dataflow provenance by this class. | packages/tools/src/result/reader.ts:65 |
| <a id="property-totalbytes"></a> `totalBytes` | `readonly` | `number` | Total byte size of the full artifact. | packages/tools/src/result/reader.ts:56 |
