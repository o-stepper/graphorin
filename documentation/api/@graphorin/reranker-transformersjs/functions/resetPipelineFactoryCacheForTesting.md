[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-transformersjs](/api/@graphorin/reranker-transformersjs/index.md) / [](/api/@graphorin/reranker-transformersjs/README.md) / \_resetPipelineFactoryCacheForTesting

# Function: \_resetPipelineFactoryCacheForTesting()

```ts
function _resetPipelineFactoryCacheForTesting(): void;
```

Defined in: [packages/reranker-transformersjs/src/cross-encoder.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/reranker-transformersjs/src/cross-encoder.ts#L92)

**`Internal`**

Test-only helper. Drops the cached pipeline factory so the next
loader call re-imports the peer.

## Returns

`void`
