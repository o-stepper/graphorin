[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / registry

# registry

Registry plumbing that lets the server route handlers locate user-
defined agents, workflows, sessions, memory, skills, and MCP
server bindings without taking a hard peer dependency on every
sibling package.

Every entry is keyed by string id; lookups never throw - callers
receive `undefined` and the route handler decides how to surface
the miss (typically a 404 with a typed error body).

W-053: compatibility of `ServerAgentLike` / `ServerWorkflowLike` with
the real `Agent` / `Workflow` surfaces is gated at compile time by
`tests/registry-contract.types.test.ts` - a drift in either direction
fails the server package's typecheck, not a user's runtime. When a
mismatch appears, fix THESE structural types (they are the copy), not
the source interfaces.

## Classes

| Class | Description |
| ------ | ------ |
| [AgentRegistry](/api/@graphorin/server/registry/classes/AgentRegistry.md) | Read/write registry for agents the server should expose. Every mutation is synchronous and the lookup is `O(1)`. |
| [WorkflowRegistry](/api/@graphorin/server/registry/classes/WorkflowRegistry.md) | - |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [AgentRegistration](/api/@graphorin/server/registry/interfaces/AgentRegistration.md) | Registration descriptor accepted by [AgentRegistry.register](/api/@graphorin/server/registry/classes/AgentRegistry.md#register). |
| [AgentSummary](/api/@graphorin/server/registry/interfaces/AgentSummary.md) | Snapshot record returned by [AgentRegistry.list](/api/@graphorin/server/registry/classes/AgentRegistry.md#list). |
| [ServerAgentLike](/api/@graphorin/server/registry/interfaces/ServerAgentLike.md) | Minimal shape the server needs from an `Agent`. Compatible with the `Agent` interface from `@graphorin/agent` but kept structurally so we avoid the peer dependency. |
| [ServerWorkflowLike](/api/@graphorin/server/registry/interfaces/ServerWorkflowLike.md) | Minimal shape the server needs from a `Workflow`. Mirrors the `Workflow` surface from `@graphorin/workflow`. |
| [WorkflowRegistration](/api/@graphorin/server/registry/interfaces/WorkflowRegistration.md) | Registration descriptor accepted by [WorkflowRegistry.register](/api/@graphorin/server/registry/classes/WorkflowRegistry.md#register). |
| [WorkflowSummary](/api/@graphorin/server/registry/interfaces/WorkflowSummary.md) | Snapshot record returned by [WorkflowRegistry.list](/api/@graphorin/server/registry/classes/WorkflowRegistry.md#list). |
