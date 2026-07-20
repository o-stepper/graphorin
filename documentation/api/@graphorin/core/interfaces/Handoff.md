[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Handoff

# Interface: Handoff

Defined in: packages/core/src/types/handoff.ts:26

**`Stable`**

Declarative handoff target. The value carries a reference to the target
agent (`agentId` - looked up at runtime via the `AgentRegistry`) plus
optional metadata used by the runtime when constructing the
`transfer_to_<agentName>` virtual tool.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-inputfilter"></a> `inputFilter?` | `readonly` | [`HandoffFilter`](/api/@graphorin/core/type-aliases/HandoffFilter.md) | Optional input filter applied to the parent's history. | packages/core/src/types/handoff.ts:32 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | Optional human-readable reason rendered in the audit log. | packages/core/src/types/handoff.ts:34 |
| <a id="property-targetagentid"></a> `targetAgentId` | `readonly` | `string` | ID of the target agent (looked up via `AgentRegistry`). | packages/core/src/types/handoff.ts:28 |
| <a id="property-targetagentname"></a> `targetAgentName?` | `readonly` | `string` | Optional human-readable name, surfaced in the virtual tool name. | packages/core/src/types/handoff.ts:30 |
