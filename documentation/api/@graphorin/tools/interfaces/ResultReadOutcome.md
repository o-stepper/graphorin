[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ResultReadOutcome

# Interface: ResultReadOutcome

Defined in: packages/tools/src/result/reader.ts:52

**`Stable`**

Outcome of [ResultReader.read](/api/@graphorin/tools/interfaces/ResultReader.md#read).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-bytes"></a> `bytes` | `readonly` | `number` | Byte length of [content](/api/@graphorin/tools/interfaces/ResultReadOutcome.md#property-content). | packages/tools/src/result/reader.ts:56 |
| <a id="property-content"></a> `content` | `readonly` | `string` | The requested slice of the artifact. | packages/tools/src/result/reader.ts:54 |
| <a id="property-eof"></a> `eof` | `readonly` | `boolean` | `true` when [content](/api/@graphorin/tools/interfaces/ResultReadOutcome.md#property-content) reaches the end of the artifact (no more to read). | packages/tools/src/result/reader.ts:60 |
| <a id="property-producerimperativeflagged"></a> `producerImperativeFlagged?` | `readonly` | `boolean` | `true` when the spill-time whole-artifact scan found a catalogued imperative pattern anywhere in the FULL artifact - a page-boundary-independent signal the per-page strip pass cannot derive from one page. Recovered from the taint sidecar by the file reader; the executor increments the cross-page operator counter on tainted reads that carry it. | packages/tools/src/result/reader.ts:81 |
| <a id="property-producersensitivity"></a> `producerSensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Sensitivity of the produced content, when the reader knows it. | packages/tools/src/result/reader.ts:72 |
| <a id="property-producersource"></a> `producerSource?` | `readonly` | [`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md) | Source of the producing tool, when the reader knows it. | packages/tools/src/result/reader.ts:70 |
| <a id="property-producertrustclass"></a> `producerTrustClass?` | `readonly` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | Trust class of the producer of the resolved artifact, when the reader knows it - e.g. the MCP resource reader always reports `'mcp-derived'`, and the file reader recovers it from the artifact's taint sidecar. The executor re-applies inbound sanitization + dataflow provenance by this class. | packages/tools/src/result/reader.ts:68 |
| <a id="property-totalbytes"></a> `totalBytes` | `readonly` | `number` | Total byte size of the full artifact. | packages/tools/src/result/reader.ts:58 |
