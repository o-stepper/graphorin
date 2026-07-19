[**Graphorin API reference v0.12.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [tools](/api/@graphorin/memory/tools/index.md) / BuildMemoryToolsOptions

# Interface: BuildMemoryToolsOptions

Defined in: packages/memory/src/tools/index.ts:83

**`Stable`**

Options for [buildMemoryTools](/api/@graphorin/memory/tools/functions/buildMemoryTools.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-includedeeprecall"></a> `includeDeepRecall?` | `readonly` | `boolean` | Append the gated `deep_recall` tool (P2-4) as a twelfth tool. The facade sets this only when `iterativeRetrieval` is configured, so the default tool surface stays at the canonical eleven. Default `false`. | packages/memory/src/tools/index.ts:99 |
| <a id="property-includerunbooksearch"></a> `includeRunbookSearch?` | `readonly` | `boolean` | Append the gated `runbook_search` tool (D3). The facade sets this only when `createMemory({ runbookSearch: true })` opts in, so the default tool surface is unchanged. Default `false`. | packages/memory/src/tools/index.ts:105 |
| <a id="property-profile"></a> `profile?` | `readonly` | [`MemoryToolProfile`](/api/@graphorin/memory/tools/type-aliases/MemoryToolProfile.md) | Tool profile (wave-D D3). `'full'` (default) keeps the canonical stable-order set; `'interactive'` builds ONLY the read tools (`fact_search`, `recall_episodes`, `conversation_search`, `fact_history`, plus the gated read appendices) - write tools do not exist in the returned array, so a front-line agent cannot mutate memory by construction; `'reviser'` is the full read+write surface for the sleep-time curation agent. | packages/memory/src/tools/index.ts:93 |
