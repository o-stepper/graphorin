[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / MemoryOwner

# Type Alias: MemoryOwner

```ts
type MemoryOwner = "user" | "agent" | "shared";
```

Defined in: packages/core/src/types/memory.ts:68

**`Stable`**

Principal a memory belongs to - the *who-owns-this* dimension,
orthogonal to [MemoryProvenance](/api/@graphorin/core/type-aliases/MemoryProvenance.md) (*where-it-came-from*):
`user` for user-stated content, `agent` for the agent's own
inferences (consolidator extraction / reflection / induction stamp
this), `shared` for records deliberately published to a multi-agent
shared tier. Absent (rows written before the feature, or writers
that do not care) is treated as `user` at filter time; default
reads apply **no owner filter**, so behaviour is unchanged until a
caller opts into a retrieval-time scope filter.
