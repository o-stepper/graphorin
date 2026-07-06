[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ResultReadOutcome

# Interface: ResultReadOutcome

Defined in: [packages/tools/src/result/reader.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L52)

Outcome of [ResultReader.read](/api/@graphorin/tools/interfaces/ResultReader.md#read).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-bytes"></a> `bytes` | `readonly` | `number` | Byte length of [content](/api/@graphorin/tools/interfaces/ResultReadOutcome.md#property-content). | [packages/tools/src/result/reader.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L56) |
| <a id="property-content"></a> `content` | `readonly` | `string` | The requested slice of the artifact. | [packages/tools/src/result/reader.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L54) |
| <a id="property-eof"></a> `eof` | `readonly` | `boolean` | `true` when [content](/api/@graphorin/tools/interfaces/ResultReadOutcome.md#property-content) reaches the end of the artifact (no more to read). | [packages/tools/src/result/reader.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L60) |
| <a id="property-producerimperativeflagged"></a> `producerImperativeFlagged?` | `readonly` | `boolean` | W-156: `true` when the spill-time whole-artifact scan found a catalogued imperative pattern anywhere in the FULL artifact - a page-boundary-independent signal the per-page strip pass cannot derive from one page. Recovered from the taint sidecar by the file reader; the executor increments the cross-page operator counter on tainted reads that carry it. | [packages/tools/src/result/reader.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L81) |
| <a id="property-producersensitivity"></a> `producerSensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Sensitivity of the produced content, when the reader knows it (tools-03). | [packages/tools/src/result/reader.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L72) |
| <a id="property-producersource"></a> `producerSource?` | `readonly` | [`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md) | Source of the producing tool, when the reader knows it (tools-03). | [packages/tools/src/result/reader.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L70) |
| <a id="property-producertrustclass"></a> `producerTrustClass?` | `readonly` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | Trust class of the producer of the resolved artifact, when the reader knows it (TL-6) - e.g. the MCP resource reader always reports `'mcp-derived'`, and the file reader recovers it from the artifact's taint sidecar (tools-03). The executor re-applies inbound sanitization + dataflow provenance by this class. | [packages/tools/src/result/reader.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L68) |
| <a id="property-totalbytes"></a> `totalBytes` | `readonly` | `number` | Total byte size of the full artifact. | [packages/tools/src/result/reader.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/reader.ts#L58) |
