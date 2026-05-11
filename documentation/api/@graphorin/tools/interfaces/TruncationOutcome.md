[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / TruncationOutcome

# Interface: TruncationOutcome

Defined in: packages/tools/src/result/truncate.ts:51

Outcome of [truncateBody](/api/@graphorin/tools/functions/truncateBody.md). Carries the truncated body and
the metadata the audit emitter writes into the
`tool:result:truncated` row.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-artifactbytes"></a> `artifactBytes?` | `readonly` | `number` | Bytes written to the spill artifact (only set for `'spill-to-file'`). | packages/tools/src/result/truncate.ts:61 |
| <a id="property-artifactpath"></a> `artifactPath?` | `readonly` | `string` | Path of the spill artifact (only set for `'spill-to-file'`). | packages/tools/src/result/truncate.ts:59 |
| <a id="property-body"></a> `body` | `readonly` | `string` | - | packages/tools/src/result/truncate.ts:53 |
| <a id="property-droppedtokens"></a> `droppedTokens` | `readonly` | `number` | - | packages/tools/src/result/truncate.ts:56 |
| <a id="property-kepttokens"></a> `keptTokens` | `readonly` | `number` | - | packages/tools/src/result/truncate.ts:55 |
| <a id="property-originaltokens"></a> `originalTokens` | `readonly` | `number` | - | packages/tools/src/result/truncate.ts:54 |
| <a id="property-strategyapplied"></a> `strategyApplied` | `readonly` | [`TruncationStrategy`](/api/@graphorin/core/type-aliases/TruncationStrategy.md) | - | packages/tools/src/result/truncate.ts:57 |
| <a id="property-summarizermodel"></a> `summarizerModel?` | `readonly` | `string` | Model name of the summarizer (only set for `'summarize'`). | packages/tools/src/result/truncate.ts:63 |
| <a id="property-truncated"></a> `truncated` | `readonly` | `boolean` | - | packages/tools/src/result/truncate.ts:52 |
