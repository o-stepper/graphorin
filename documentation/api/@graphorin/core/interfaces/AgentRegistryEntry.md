[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentRegistryEntry

# Interface: AgentRegistryEntry

Defined in: packages/core/src/contracts/session-store.ts:30

**`Stable`**

Agent registry entry. Captures stable metadata about every agent that
ever produced a message - so JSONL exports / replays can resolve a
`Message.agentId` to a human-readable name even after the agent was
renamed or retired.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-displayname"></a> `displayName` | `readonly` | `string` | packages/core/src/contracts/session-store.ts:32 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/core/src/contracts/session-store.ts:31 |
| <a id="property-registeredat"></a> `registeredAt` | `readonly` | `string` | packages/core/src/contracts/session-store.ts:33 |
| <a id="property-retiredat"></a> `retiredAt?` | `readonly` | `string` | packages/core/src/contracts/session-store.ts:34 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | packages/core/src/contracts/session-store.ts:35 |
