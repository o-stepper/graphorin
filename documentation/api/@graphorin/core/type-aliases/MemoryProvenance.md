[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemoryProvenance

# Type Alias: MemoryProvenance

```ts
type MemoryProvenance = "user" | "tool" | "extraction" | "reflection" | "induction" | "imported";
```

Defined in: packages/core/src/types/memory.ts:37

**`Stable`**

Where a memory came from - the trust-provenance tag carried by every
fact / episode / induced procedure. `user` (the human said it) and
`tool` (a tool the agent invoked returned it) are first-party;
`extraction` (consolidator distilled it from a transcript),
`reflection` (a synthesis pass inferred it), and `induction` (an
AWM-style pass distilled a reusable workflow from a successful agent
trajectory) are *derived* and therefore land quarantined by
default; `imported` is bulk-loaded from an external store. Used
to gate action-driving recall against memory-poisoning (MINJA /
MemoryGraft) - induced procedures drive *actions*, so the quarantine
gate matters most for them.
