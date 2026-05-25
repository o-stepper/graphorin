[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AgentToToolOptions

# Interface: AgentToToolOptions

Defined in: packages/agent/src/types.ts:283

`agent.toTool({...})` options.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | packages/agent/src/types.ts:285 |
| <a id="property-exposeturns"></a> `exposeTurns?` | `readonly` | `"none"` \| `"final"` \| `"all"` | packages/agent/src/types.ts:286 |
| <a id="property-inheritsecrets"></a> `inheritSecrets?` | `readonly` | readonly `string`[] | packages/agent/src/types.ts:288 |
| <a id="property-inputfilter"></a> `inputFilter?` | `readonly` | [`HandoffFilter`](/api/@graphorin/core/type-aliases/HandoffFilter.md) | packages/agent/src/types.ts:289 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | packages/agent/src/types.ts:284 |
| <a id="property-secretsinheritance"></a> `secretsInheritance?` | `readonly` | `"inherit-allowlist"` \| `"isolated"` \| `"forward-explicit"` | packages/agent/src/types.ts:287 |
