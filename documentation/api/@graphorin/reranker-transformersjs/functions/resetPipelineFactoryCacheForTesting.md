[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / \_resetPipelineFactoryCacheForTesting

# Function: \_resetPipelineFactoryCacheForTesting()

```ts
function _resetPipelineFactoryCacheForTesting(): void;
```

Defined in: packages/reranker-transformersjs/src/cross-encoder.ts:165

**`Internal`**

Test-only helper. Drops the cached module so the next loader call
re-imports the peer.

## Returns

`void`
