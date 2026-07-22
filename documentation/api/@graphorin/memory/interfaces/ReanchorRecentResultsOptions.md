[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ReanchorRecentResultsOptions

# Interface: ReanchorRecentResultsOptions

Defined in: packages/memory/src/context-engine/compaction/hooks/reanchor-recent-results.ts:27

Options for [reanchorRecentResults](/api/@graphorin/memory/functions/reanchorRecentResults.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-maxchars"></a> `maxChars?` | `readonly` | `number` | Character budget for the whole injected block. Default `4000`. | packages/memory/src/context-engine/compaction/hooks/reanchor-recent-results.ts:31 |
| <a id="property-maxresults"></a> `maxResults?` | `readonly` | `number` | Most-recent distinct handles re-anchored. Default `3`. | packages/memory/src/context-engine/compaction/hooks/reanchor-recent-results.ts:29 |
| <a id="property-readpreview"></a> `readPreview?` | `readonly` | (`uri`) => `Promise`\&lt;`string` \| `null`\&gt; | Optional preview resolver - wire it to the runtime's result reader (e.g. an adapter over the agent's spill reader). Returns the preview text or `null` when the handle cannot be read; failures are treated as `null`. Without it the hook lists the handles alone, which is still enough for the model to `read_result` them on demand. | packages/memory/src/context-engine/compaction/hooks/reanchor-recent-results.ts:39 |
