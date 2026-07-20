[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / PERMANENT\_LOOPBACK\_CLASSIFICATION

# Variable: PERMANENT\_LOOPBACK\_CLASSIFICATION

```ts
const PERMANENT_LOOPBACK_CLASSIFICATION: LocalProviderClassification;
```

Defined in: packages/provider/src/trust/classify-local-provider.ts:250

**`Stable`**

Permanent loopback classification used by in-process adapters
(e.g. the `llamaCppNodeAdapter` companion package). Adapters that
have no `baseUrl` declare this directly to make the source-of-truth
symmetry obvious.
