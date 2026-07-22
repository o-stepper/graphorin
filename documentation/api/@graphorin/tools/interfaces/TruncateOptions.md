[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / TruncateOptions

# Interface: TruncateOptions

Defined in: packages/tools/src/result/truncate.ts:169

**`Stable`**

Configuration for [truncateBody](/api/@graphorin/tools/functions/truncateBody.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-counter"></a> `counter?` | `readonly` | [`TokenCounter`](/api/@graphorin/tools/interfaces/TokenCounter.md) | - | packages/tools/src/result/truncate.ts:170 |
| <a id="property-imperativebudgetms"></a> `imperativeBudgetMs?` | `readonly` | `number` | Budget for the spill-time scan in milliseconds. Default `250`. | packages/tools/src/result/truncate.ts:195 |
| <a id="property-imperativepatterns"></a> `imperativePatterns?` | `readonly` | readonly [`ImperativePattern`](/api/@graphorin/observability/redaction/imperative-patterns/interfaces/ImperativePattern.md)[] | Pattern catalogue for the single scan over the FULL body at spill time (defaults to the built-in catalogue). The per-page strip pass in the executor cannot see a pattern split by a `read_result` page boundary; this whole-artifact scan can. | packages/tools/src/result/truncate.ts:193 |
| <a id="property-producersource"></a> `producerSource?` | `readonly` | `unknown` | Effective source of the content's producer (a JSON-serializable `ToolSource` value; see [producerTrustClass](/api/@graphorin/tools/interfaces/TruncateOptions.md#property-producertrustclass)). | packages/tools/src/result/truncate.ts:186 |
| <a id="property-producertrustclass"></a> `producerTrustClass?` | `readonly` | `string` | Effective trust class of the content's producer, forwarded to [SpillWriter.write](/api/@graphorin/tools/interfaces/SpillWriter.md#write) so the artifact's taint survives process / executor boundaries. | packages/tools/src/result/truncate.ts:181 |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | - | packages/tools/src/result/truncate.ts:173 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/tools/src/result/truncate.ts:196 |
| <a id="property-spill"></a> `spill?` | `readonly` | [`SpillWriter`](/api/@graphorin/tools/interfaces/SpillWriter.md) | - | packages/tools/src/result/truncate.ts:172 |
| <a id="property-summarizer"></a> `summarizer?` | `readonly` | [`ResultSummarizer`](/api/@graphorin/tools/interfaces/ResultSummarizer.md) | - | packages/tools/src/result/truncate.ts:171 |
| <a id="property-toolcallid"></a> `toolCallId?` | `readonly` | `string` | - | packages/tools/src/result/truncate.ts:174 |
| <a id="property-toolsensitivitytier"></a> `toolSensitivityTier?` | `readonly` | `string` | - | packages/tools/src/result/truncate.ts:175 |
