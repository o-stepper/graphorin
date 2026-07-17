[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemoryProvenance

# Type Alias: MemoryProvenance

```ts
type MemoryProvenance = "user" | "tool" | "extraction" | "reflection" | "induction" | "imported";
```

Defined in: [packages/core/src/types/memory.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/memory.ts#L37)

Where a memory came from - the trust-provenance tag carried by every
fact / episode / induced procedure. `user` (the human said it) and
`tool` (a tool the agent invoked returned it) are first-party;
`extraction` (consolidator distilled it from a transcript),
`reflection` (a synthesis pass inferred it), and `induction` (an
AWM-style pass distilled a reusable workflow from a successful agent
trajectory, P2-2) are *derived* and therefore land quarantined by
default; `imported` is bulk-loaded from an external store. Used by
P1-4 to gate action-driving recall against memory-poisoning (MINJA /
MemoryGraft) - induced procedures drive *actions*, so the quarantine
gate matters most for them.

## Stable
