[**Graphorin API reference v0.12.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [agent-registry](/api/@graphorin/sessions/agent-registry/index.md) / AgentRegistryLookup

# Type Alias: AgentRegistryLookup

```ts
type AgentRegistryLookup = 
  | {
  agent: AgentRegistryEntry;
  kind: "agent";
}
  | {
  id: string;
  kind: "unknown";
};
```

Defined in: [packages/sessions/src/agent-registry.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/agent-registry.ts#L26)

Result of [AgentRegistry.resolveOrPlaceholder](/api/@graphorin/sessions/agent-registry/classes/AgentRegistry.md#resolveorplaceholder). Either the
stored agent metadata, or a placeholder discriminated by
`kind: 'unknown'` so callers can render "(deleted) Worker Agent".

## Stable
