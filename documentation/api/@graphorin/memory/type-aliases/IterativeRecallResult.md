[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / IterativeRecallResult

# Type Alias: IterativeRecallResult

```ts
type IterativeRecallResult = IterativeRetrievalResult<MemoryHit<Fact>>;
```

Defined in: [packages/memory/src/tiers/semantic-memory.ts:361](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/tiers/semantic-memory.ts#L361)

Outcome of [SemanticMemory.searchIterative](/api/@graphorin/memory/classes/SemanticMemory.md#searchiterative). Beyond the ranked
`hits`, `sufficient` / `abstained` tell the caller whether the memory
actually answered the query - `abstained: true` means it should say so
rather than confabulate.

## Stable
