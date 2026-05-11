[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AgentToToolOptions

# Interface: AgentToToolOptions

Defined in: packages/agent/src/types.ts:233

`agent.toTool({...})` options.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | packages/agent/src/types.ts:235 |
| <a id="property-exposeturns"></a> `exposeTurns?` | `readonly` | `"none"` \| `"final"` \| `"all"` | packages/agent/src/types.ts:236 |
| <a id="property-inheritsecrets"></a> `inheritSecrets?` | `readonly` | readonly `string`[] | packages/agent/src/types.ts:238 |
| <a id="property-inputfilter"></a> `inputFilter?` | `readonly` | [`HandoffFilter`](/api/@graphorin/core/type-aliases/HandoffFilter.md) | packages/agent/src/types.ts:239 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | packages/agent/src/types.ts:234 |
| <a id="property-secretsinheritance"></a> `secretsInheritance?` | `readonly` | `"inherit-allowlist"` \| `"isolated"` \| `"forward-explicit"` | packages/agent/src/types.ts:237 |
