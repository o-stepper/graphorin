[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / DEFAULT\_CONFLICT\_THRESHOLDS

# Variable: DEFAULT\_CONFLICT\_THRESHOLDS

```ts
const DEFAULT_CONFLICT_THRESHOLDS: ConflictThresholds;
```

Defined in: packages/memory/src/conflict/types.ts:54

**`Stable`**

Hard-coded defaults for the three-zone thresholds. Imported by the
pipeline + the test suite so call sites stay aligned.

The values are **raw cosine** similarities (DEC-130). Storage
adapters normalize KNN scores into `[0, 1]` (`(1 + cos) / 2` for the
cosine metric - CS-3, `scoreFromDistance` in
`@graphorin/store-sqlite`), so Stage 2 / Stage 5 first map incoming
hit scores back to raw cosine via `rawCosineFromStoreScore`
before comparing against these thresholds.
