[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/embedder-ollama](/api/@graphorin/embedder-ollama/index.md) / [](/api/@graphorin/embedder-ollama/README.md) / createOllamaEmbedder

# Function: createOllamaEmbedder()

```ts
function createOllamaEmbedder(options?): OllamaEmbedder;
```

Defined in: packages/embedder-ollama/src/index.ts:125

**`Stable`**

Build an Ollama-backed embedder. The first `embed()` call issues a
`POST /api/show` to capture the model digest; subsequent calls hit
the embedding endpoint directly.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`OllamaEmbedderOptions`](/api/@graphorin/embedder-ollama/interfaces/OllamaEmbedderOptions.md) |

## Returns

[`OllamaEmbedder`](/api/@graphorin/embedder-ollama/classes/OllamaEmbedder.md)
