[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/embedder-ollama](/api/@graphorin/embedder-ollama/index.md) / [](/api/@graphorin/embedder-ollama/README.md) / KNOWN\_OLLAMA\_MODEL\_DIMS

# Variable: KNOWN\_OLLAMA\_MODEL\_DIMS

```ts
const KNOWN_OLLAMA_MODEL_DIMS: ReadonlyMap<string, number>;
```

Defined in: [packages/embedder-ollama/src/index.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/embedder-ollama/src/index.ts#L105)

Model -> output-dimension hints used to seed the canonical id before the
first `embed()` resolves the real width from a response. Only single-width
families are listed; size-variant families (e.g. `qwen3-embedding`, whose
dim depends on the `:0.6b` / `:4b` / `:8b` tag) are deliberately omitted so
an ambiguous bind fails loudly rather than baking a wrong width (PS-11).
