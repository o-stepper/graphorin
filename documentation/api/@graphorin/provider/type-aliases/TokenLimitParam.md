[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / TokenLimitParam

# Type Alias: TokenLimitParam

```ts
type TokenLimitParam = "max_tokens" | "max_completion_tokens";
```

Defined in: packages/provider/src/internal/openai-shaped.ts:52

**`Stable`**

Wire name for the completion-token ceiling. The long tail of
OpenAI-compatible servers (llama.cpp, LM Studio, vLLM, LocalAI)
expects `max_tokens`; current OpenAI models (GPT-5 family,
o-series) reject it with HTTP 400 and require
`max_completion_tokens`.
