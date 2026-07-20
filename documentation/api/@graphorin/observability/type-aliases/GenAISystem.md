[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / GenAISystem

# Type Alias: GenAISystem

```ts
type GenAISystem = 
  | "anthropic"
  | "openai"
  | "google"
  | "mistral"
  | "ollama"
  | "openrouter"
  | "azure_ai_inference"
  | "aws.bedrock"
  | "cohere"
  | "vertex_ai"
  | "graphorin-llamacpp"
  | "graphorin-openai-compatible"
  | string & {
  __genAiSystem?: never;
};
```

Defined in: packages/observability/src/gen-ai/types.ts:16

**`Stable`**

Canonical OpenTelemetry semantic-conventions vendor enum used as the
value of the `gen_ai.system` attribute.
