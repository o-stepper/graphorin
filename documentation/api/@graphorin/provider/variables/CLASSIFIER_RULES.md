[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / CLASSIFIER\_RULES

# Variable: CLASSIFIER\_RULES

```ts
const CLASSIFIER_RULES: readonly ClassifierRule[];
```

Defined in: packages/provider/src/model-tier/classify.ts:40

**`Stable`**

The static rule table. Order matters - higher-specificity entries
come first (e.g. `claude-haiku` before `claude-`). Tests assert
that the table covers the canonical 2026 model families.
