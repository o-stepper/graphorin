[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AgentCapability

# Type Alias: AgentCapability

```ts
type AgentCapability = "read-only";
```

Defined in: packages/agent/src/types.ts:703

**`Stable`**

Run-level capability restriction (the single-writer constraint
from multi-agent practice). `'read-only'` makes the run
side-effect-free by construction: writer tools (`side-effecting` /
`external-stateful`) and handoffs are never advertised to the model,
and the tool executor deterministically blocks any writer call the
model fabricates anyway (`capability_blocked`). Use it to run
parallel research / explorer sub-agents while exactly one agent in
the topology keeps write capability.
