[**Graphorin API reference v0.12.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [agent-registry](/api/@graphorin/sessions/agent-registry/index.md) / RegisterAgentOptions

# Interface: RegisterAgentOptions

Defined in: [packages/sessions/src/agent-registry.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/agent-registry.ts#L37)

Optional options accepted by [AgentRegistry.register](/api/@graphorin/sessions/agent-registry/classes/AgentRegistry.md#register). The
registration is idempotent on `id` - re-registering the same id
refreshes the display name + tags.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-displayname"></a> `displayName` | `readonly` | `string` | - | [packages/sessions/src/agent-registry.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/agent-registry.ts#L38) |
| <a id="property-registeredat"></a> `registeredAt?` | `readonly` | `string` | Override the registration timestamp (test seam). | [packages/sessions/src/agent-registry.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/agent-registry.ts#L41) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | [packages/sessions/src/agent-registry.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/agent-registry.ts#L39) |
