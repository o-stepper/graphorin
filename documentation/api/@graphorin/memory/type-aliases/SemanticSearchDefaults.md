[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SemanticSearchDefaults

# Type Alias: SemanticSearchDefaults

```ts
type SemanticSearchDefaults = Pick<FactSearchOptions, 
  | "multiQuery"
  | "hyde"
  | "expandHops"
  | "entityMatch"
  | "graphScoring"
  | "fusion"
  | "decay"
| "candidateTopK">;
```

Defined in: packages/memory/src/tiers/semantic-memory.ts:148

**`Stable`**

Search options an operator may default at construction time via
`createMemory({ searchDefaults })` - the advanced-retrieval
switches (fan-out, HyDE, graph expansion, fusion, decay) that the
model-facing surfaces (`fact_search`, auto-recall, `deep_recall`)
cannot reach per-call. Deliberately a `Pick` that EXCLUDES the
trust-sensitive predicates (`includeQuarantined`, `includeSuperseded`,
`trustWeighting`, `owner`): configuration must not be able to silently
weaken trust gates for every caller. Per-call options always win
key-by-key.
