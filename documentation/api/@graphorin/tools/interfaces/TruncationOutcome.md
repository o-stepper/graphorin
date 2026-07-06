[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / TruncationOutcome

# Interface: TruncationOutcome

Defined in: [packages/tools/src/result/truncate.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/truncate.ts#L53)

Outcome of [truncateBody](/api/@graphorin/tools/functions/truncateBody.md). Carries the truncated body and
the metadata the audit emitter writes into the
`tool:result:truncated` row.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-artifactbytes"></a> `artifactBytes?` | `readonly` | `number` | Bytes written to the spill artifact (only set for `'spill-to-file'`). | [packages/tools/src/result/truncate.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/truncate.ts#L63) |
| <a id="property-artifactpath"></a> `artifactPath?` | `readonly` | `string` | Path of the spill artifact (only set for `'spill-to-file'`). | [packages/tools/src/result/truncate.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/truncate.ts#L61) |
| <a id="property-body"></a> `body` | `readonly` | `string` | - | [packages/tools/src/result/truncate.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/truncate.ts#L55) |
| <a id="property-droppedtokens"></a> `droppedTokens` | `readonly` | `number` | - | [packages/tools/src/result/truncate.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/truncate.ts#L58) |
| <a id="property-kepttokens"></a> `keptTokens` | `readonly` | `number` | - | [packages/tools/src/result/truncate.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/truncate.ts#L57) |
| <a id="property-originaltokens"></a> `originalTokens` | `readonly` | `number` | - | [packages/tools/src/result/truncate.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/truncate.ts#L56) |
| <a id="property-resulthandle"></a> `resultHandle?` | `readonly` | `string` | Opaque, run-scoped handle URI for the spill artifact - e.g. `graphorin-spill:<runId>/<toolCallId>.<ext>` (only set for `'spill-to-file'`). This is the model-facing reference embedded in the truncation annotation; unlike [artifactPath](/api/@graphorin/tools/interfaces/TruncationOutcome.md#property-artifactpath) it carries no raw filesystem path. Resolve it with `createFileResultReader` / the built-in `read_result` tool. | [packages/tools/src/result/truncate.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/truncate.ts#L72) |
| <a id="property-spillimperativepatternspresent"></a> `spillImperativePatternsPresent?` | `readonly` | `boolean` | W-156: result of the single spill-time imperative-pattern scan over the FULL body (only set for `'spill-to-file'`, and only when the scan completed within budget). `true` means the artifact contains at least one catalogued imperative pattern - including one a future `read_result` page boundary would split, which the per-page strip pass cannot see. The executor stores it in the handle taint map and the default writer persists it in the taint sidecar. | [packages/tools/src/result/truncate.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/truncate.ts#L83) |
| <a id="property-strategyapplied"></a> `strategyApplied` | `readonly` | [`TruncationStrategy`](/api/@graphorin/core/type-aliases/TruncationStrategy.md) | - | [packages/tools/src/result/truncate.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/truncate.ts#L59) |
| <a id="property-summarizermodel"></a> `summarizerModel?` | `readonly` | `string` | Model name of the summarizer (only set for `'summarize'`). | [packages/tools/src/result/truncate.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/truncate.ts#L85) |
| <a id="property-truncated"></a> `truncated` | `readonly` | `boolean` | - | [packages/tools/src/result/truncate.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/truncate.ts#L54) |
