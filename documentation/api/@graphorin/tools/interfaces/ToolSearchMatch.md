[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolSearchMatch

# Interface: ToolSearchMatch

Defined in: packages/tools/src/registry/types.ts:100

**`Stable`**

Match returned by [ToolRegistry.searchDeferred](/api/@graphorin/tools/interfaces/ToolRegistry.md#searchdeferred). Carries the
stage that produced the match so consumers can detect rank-chain
fallback and surface it on the trace span.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string` | - | packages/tools/src/registry/types.ts:102 |
| <a id="property-inputschema"></a> `inputSchema` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | packages/tools/src/registry/types.ts:103 |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | packages/tools/src/registry/types.ts:101 |
| <a id="property-outputschema"></a> `outputSchema?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | The matched tool's output schema, when declared (renders a return type). | packages/tools/src/registry/types.ts:105 |
| <a id="property-score"></a> `score` | `readonly` | `number` | - | packages/tools/src/registry/types.ts:106 |
| <a id="property-source"></a> `source` | `readonly` | `"semantic"` \| `"bm25"` \| `"regex-name"` | - | packages/tools/src/registry/types.ts:107 |
