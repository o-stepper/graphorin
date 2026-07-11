[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [tools](/api/@graphorin/memory/tools/index.md) / BuildMemoryToolsOptions

# Interface: BuildMemoryToolsOptions

Defined in: [packages/memory/src/tools/index.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tools/index.ts#L60)

Options for [buildMemoryTools](/api/@graphorin/memory/tools/functions/buildMemoryTools.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-includedeeprecall"></a> `includeDeepRecall?` | `readonly` | `boolean` | Append the gated `deep_recall` tool (P2-4) as a twelfth tool. The facade sets this only when `iterativeRetrieval` is configured, so the default tool surface stays at the canonical eleven. Default `false`. | [packages/memory/src/tools/index.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tools/index.ts#L66) |
| <a id="property-includerunbooksearch"></a> `includeRunbookSearch?` | `readonly` | `boolean` | Append the gated `runbook_search` tool (D3). The facade sets this only when `createMemory({ runbookSearch: true })` opts in, so the default tool surface is unchanged. Default `false`. | [packages/memory/src/tools/index.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tools/index.ts#L72) |
