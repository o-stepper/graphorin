[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / GenAIToolType

# Type Alias: GenAIToolType

```ts
type GenAIToolType = 
  | "function"
  | "web_search"
  | "database"
  | "code_interpreter"
  | "image_generation"
  | "file_search";
```

Defined in: [packages/observability/src/gen-ai/types.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/gen-ai/types.ts#L37)

`gen_ai.tool.type` enum value. Defaults to `'function'` for
user-defined and MCP-derived tools without explicit declaration.

## Stable
