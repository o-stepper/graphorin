[**Graphorin API reference v0.4.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [tools](/api/@graphorin/memory/tools/index.md) / BuildMemoryToolsOptions

# Interface: BuildMemoryToolsOptions

Defined in: packages/memory/src/tools/index.ts:58

Options for [buildMemoryTools](/api/@graphorin/memory/tools/functions/buildMemoryTools.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-includedeeprecall"></a> `includeDeepRecall?` | `readonly` | `boolean` | Append the gated `deep_recall` tool (P2-4) as a twelfth tool. The facade sets this only when `iterativeRetrieval` is configured, so the default tool surface stays at the canonical eleven. Default `false`. | packages/memory/src/tools/index.ts:64 |
