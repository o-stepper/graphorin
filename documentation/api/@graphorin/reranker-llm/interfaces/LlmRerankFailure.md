[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / LlmRerankFailure

# Interface: LlmRerankFailure

Defined in: src/reranker.ts:41

**`Stable`**

One recorded per-passage scoring failure from the most recent
`rerank(...)` call (deep-retest-0.13.11: `lastErrorCount` alone said
"something failed" but live diagnosis needed the status/stage, which
meant re-running billed external calls).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"provider-error"` \| `"off-format"` | `'provider-error'` - the `generate` call rejected (counted in `lastErrorCount`); `'off-format'` - the reply carried no parseable integer and the passage fell back (counted in `lastOffFormatCount`). | src/reranker.ts:49 |
| <a id="property-message"></a> `message` | `readonly` | `string` | Error message, or the (truncated) off-format reply text. | src/reranker.ts:55 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Error class name for provider errors (e.g. `'ProviderHttpError'`). | src/reranker.ts:51 |
| <a id="property-passageindex"></a> `passageIndex` | `readonly` | `number` | Index of the passage in the merged candidate list. | src/reranker.ts:43 |
| <a id="property-status"></a> `status?` | `readonly` | `number` | HTTP status when the underlying failure carried one. | src/reranker.ts:53 |
