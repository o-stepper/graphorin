[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / agent-registry

# agent-registry

`AgentRegistry` - the per-session-manager catalogue of every agent
that has ever produced a message in a session. The registry exists
to keep replay working long after the agent has been renamed or
deleted: orphan `agent_id` references on stored messages can always
be resolved via `resolveOrPlaceholder(...)`.

The registry is in-memory + write-through to the configured
`SessionStoreExt`. The package-level singleton instance is owned by
the `createSessionManager` facade in `./facade.ts`; consumers
never construct an `AgentRegistry` directly.

## Classes

| Class | Description |
| ------ | ------ |
| [AgentRegistry](/api/@graphorin/sessions/agent-registry/classes/AgentRegistry.md) | In-memory + write-through registry of agent metadata. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [RegisterAgentOptions](/api/@graphorin/sessions/agent-registry/interfaces/RegisterAgentOptions.md) | Optional options accepted by [AgentRegistry.register](/api/@graphorin/sessions/agent-registry/classes/AgentRegistry.md#register). The registration is idempotent on `id` - re-registering the same id refreshes the display name + tags. |
| [RetireAgentOptions](/api/@graphorin/sessions/agent-registry/interfaces/RetireAgentOptions.md) | Optional options accepted by [AgentRegistry.retire](/api/@graphorin/sessions/agent-registry/classes/AgentRegistry.md#retire) and [AgentRegistry.delete](/api/@graphorin/sessions/agent-registry/classes/AgentRegistry.md#delete). |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [AgentRegistryLookup](/api/@graphorin/sessions/agent-registry/type-aliases/AgentRegistryLookup.md) | Result of [AgentRegistry.resolveOrPlaceholder](/api/@graphorin/sessions/agent-registry/classes/AgentRegistry.md#resolveorplaceholder). Either the stored agent metadata, or a placeholder discriminated by `kind: 'unknown'` so callers can render "(deleted) Worker Agent". |
| [DeleteAgentOptions](/api/@graphorin/sessions/agent-registry/type-aliases/DeleteAgentOptions.md) | Same shape as [RetireAgentOptions](/api/@graphorin/sessions/agent-registry/interfaces/RetireAgentOptions.md) for `delete(...)`. |
