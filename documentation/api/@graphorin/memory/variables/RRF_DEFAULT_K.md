[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / RRF\_DEFAULT\_K

# Variable: RRF\_DEFAULT\_K

```ts
const RRF_DEFAULT_K: 60 = 60;
```

Defined in: packages/memory/src/search/rrf.ts:12

**`Stable`**

Industry-standard Reciprocal Rank Fusion constant. Lower `k` makes
top-ranked items dominate; higher `k` smooths the contribution of
lower-ranked items. `k = 60` is the value popularised by Cormack,
Clarke, and Büttcher (2009) and is the framework default.
