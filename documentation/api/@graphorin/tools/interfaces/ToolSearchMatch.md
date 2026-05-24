[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolSearchMatch

# Interface: ToolSearchMatch

Defined in: packages/tools/src/registry/types.ts:86

Match returned by [ToolRegistry.searchDeferred](/api/@graphorin/tools/interfaces/ToolRegistry.md#searchdeferred). Carries the
stage that produced the match so consumers can detect rank-chain
fallback and surface it on the trace span.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string` | packages/tools/src/registry/types.ts:88 |
| <a id="property-inputschema"></a> `inputSchema` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/tools/src/registry/types.ts:89 |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/tools/src/registry/types.ts:87 |
| <a id="property-score"></a> `score` | `readonly` | `number` | packages/tools/src/registry/types.ts:90 |
| <a id="property-source"></a> `source` | `readonly` | `"semantic"` \| `"bm25"` \| `"regex-name"` | packages/tools/src/registry/types.ts:91 |
