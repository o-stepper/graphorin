[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / HandoffSecretsInheritance

# Type Alias: HandoffSecretsInheritance

```ts
type HandoffSecretsInheritance = "inherit-allowlist" | "isolated" | "forward-explicit";
```

Defined in: packages/core/src/types/handoff.ts:74

**`Stable`**

How the parent's secrets surface is propagated to the sub-agent
during a handoff. The default - `'inherit-allowlist'` with an empty
inherited list - applies the principle of least authority: the sub-
agent inherits only the keys the operator has explicitly named.

- `'inherit-allowlist'` - inherit the keys named in
  `inheritedSecrets`. Empty list = no inheritance.
- `'isolated'` - the sub-agent runs with an empty secrets surface.
- `'forward-explicit'` - every secret access on the sub-agent's side
  must be explicitly broadened by the operator with a recorded
  `secretsOverrideReason`.
