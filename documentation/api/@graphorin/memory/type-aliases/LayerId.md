[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / LayerId

# Type Alias: LayerId

```ts
type LayerId = 
  | "identity"
  | "memoryMetadata"
  | "activeRules"
  | "workingBlocks"
  | "activeSkills"
  | "autoRecall";
```

Defined in: packages/memory/src/context-engine/token-budget.ts:34

**`Stable`**

Layer-id discriminator. Mirrors the documented Layer 1-6
structure of the layered system prompt.
