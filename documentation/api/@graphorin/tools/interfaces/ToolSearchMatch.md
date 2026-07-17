[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolSearchMatch

# Interface: ToolSearchMatch

Defined in: [packages/tools/src/registry/types.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L100)

Match returned by [ToolRegistry.searchDeferred](/api/@graphorin/tools/interfaces/ToolRegistry.md#searchdeferred). Carries the
stage that produced the match so consumers can detect rank-chain
fallback and surface it on the trace span.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string` | - | [packages/tools/src/registry/types.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L102) |
| <a id="property-inputschema"></a> `inputSchema` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | [packages/tools/src/registry/types.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L103) |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | [packages/tools/src/registry/types.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L101) |
| <a id="property-outputschema"></a> `outputSchema?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | A5: the matched tool's output schema, when declared (renders a return type). | [packages/tools/src/registry/types.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L105) |
| <a id="property-score"></a> `score` | `readonly` | `number` | - | [packages/tools/src/registry/types.ts:106](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L106) |
| <a id="property-source"></a> `source` | `readonly` | `"semantic"` \| `"bm25"` \| `"regex-name"` | - | [packages/tools/src/registry/types.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L107) |
