[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / \_resetPipelineFactoryCacheForTesting

# Function: \_resetPipelineFactoryCacheForTesting()

```ts
function _resetPipelineFactoryCacheForTesting(): void;
```

Defined in: packages/reranker-transformersjs/src/cross-encoder.ts:92

**`Internal`**

Test-only helper. Drops the cached pipeline factory so the next
loader call re-imports the peer.

## Returns

`void`
