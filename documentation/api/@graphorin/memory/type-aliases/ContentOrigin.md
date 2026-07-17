[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ContentOrigin

# Type Alias: ContentOrigin

```ts
type ContentOrigin = 
  | "memory:tier-filtered"
  | "system:framework"
  | "agent:instructions"
  | "skill:content"
  | "user:input"
  | "tool:result"
  | "mcp:response"
  | "tool-call:args";
```

Defined in: [packages/memory/src/context-engine/annotations.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/annotations.ts#L49)

Origin discriminator for an assembled message-content part. The
non-ContextEngine origins (`'user:input'`, `'tool:result'`,
`'mcp:response'`, `'tool-call:args'`) are tagged by Phase 12
(agent runtime) when the corresponding payload enters
`session_messages`; the ContextEngine then propagates the tag
through the assembled message list.

## Stable
