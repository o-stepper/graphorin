[**Graphorin API reference v0.13.4**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [agent-registry](/api/@graphorin/sessions/agent-registry/index.md) / RetireAgentOptions

# Interface: RetireAgentOptions

Defined in: packages/sessions/src/agent-registry.ts:50

**`Stable`**

Optional options accepted by [AgentRegistry.retire](/api/@graphorin/sessions/agent-registry/classes/AgentRegistry.md#retire) and
[AgentRegistry.delete](/api/@graphorin/sessions/agent-registry/classes/AgentRegistry.md#delete).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-assertexists"></a> `assertExists?` | `readonly` | `boolean` | Throw [AgentNotFoundError](/api/@graphorin/sessions/errors/classes/AgentNotFoundError.md) when the id is unknown. | packages/sessions/src/agent-registry.ts:53 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | - | packages/sessions/src/agent-registry.ts:51 |
