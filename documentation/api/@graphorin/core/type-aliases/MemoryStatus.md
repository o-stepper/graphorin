[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemoryStatus

# Type Alias: MemoryStatus

```ts
type MemoryStatus = "active" | "quarantined";
```

Defined in: packages/core/src/types/memory.ts:53

**`Stable`**

Retrieval-trust state of a memory. `active` rows are eligible for
default recall; `quarantined` rows are persisted and auditable but
excluded from action-driving recall until explicitly validated.
Quarantine is a *retrieval gate*, never a delete.
