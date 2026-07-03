[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AgentToToolOptions

# Interface: AgentToToolOptions

Defined in: packages/agent/src/types.ts:320

`agent.toTool({...})` options.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | - | packages/agent/src/types.ts:322 |
| <a id="property-exposeturns"></a> `exposeTurns?` | `readonly` | `"none"` \| `"final"` \| `"all"` | - | packages/agent/src/types.ts:323 |
| <a id="property-inputfilter"></a> `inputFilter?` | `readonly` | [`HandoffFilter`](/api/@graphorin/core/type-aliases/HandoffFilter.md) | Shapes the sub-agent seed from the parent history (AG-17): when supplied, the sub-agent is seeded with `[...inputFilter(parentMessages), { role: 'user', content: input }]`. Without a filter the sub-agent sees ONLY the input string — no parent conversation crosses the boundary (least authority by construction; there is no secret-inheritance mechanism at this boundary at all). | packages/agent/src/types.ts:333 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | - | packages/agent/src/types.ts:321 |
