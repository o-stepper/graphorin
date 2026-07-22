[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ToolSearchResolvedRecord

# Interface: ToolSearchResolvedRecord

Defined in: packages/sessions/src/cassette/types.ts:115

**`Stable`**

`tool_search` lazy-load resolution event.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"tool-search-resolved"` | packages/sessions/src/cassette/types.ts:116 |
| <a id="property-matchcount"></a> `matchCount` | `readonly` | `number` | packages/sessions/src/cassette/types.ts:119 |
| <a id="property-query"></a> `query` | `readonly` | `string` | packages/sessions/src/cassette/types.ts:118 |
| <a id="property-resolvedtoolnames"></a> `resolvedToolNames` | `readonly` | readonly `string`[] | packages/sessions/src/cassette/types.ts:120 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | packages/sessions/src/cassette/types.ts:117 |
