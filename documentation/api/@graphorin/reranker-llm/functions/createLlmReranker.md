[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/reranker-llm](/api/@graphorin/reranker-llm/index.md) / [](/api/@graphorin/reranker-llm/README.md) / createLlmReranker

# Function: createLlmReranker()

```ts
function createLlmReranker<TRecord>(options): LlmReRanker<TRecord>;
```

Defined in: src/reranker.ts:118

**`Stable`**

Build an LLM-as-reranker. The reranker is stateless past the
provider reference - the provider's own session / connection
lifecycle owns the network resources.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRecord` *extends* [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) | [`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LlmRerankerOptions`](/api/@graphorin/reranker-llm/interfaces/LlmRerankerOptions.md)\&lt;`TRecord`\&gt; |

## Returns

[`LlmReRanker`](/api/@graphorin/reranker-llm/classes/LlmReRanker.md)\&lt;`TRecord`\&gt;
