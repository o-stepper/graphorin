[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider-llamacpp-node](/api/@graphorin/provider-llamacpp-node/index.md) / [](/api/@graphorin/provider-llamacpp-node/README.md) / LlamaChatHistoryItem

# Type Alias: LlamaChatHistoryItem

```ts
type LlamaChatHistoryItem = 
  | {
  text: string;
  type: "system";
}
  | {
  text: string;
  type: "user";
}
  | {
  response: ReadonlyArray<string>;
  type: "model";
};
```

Defined in: src/runtime.ts:39

**`Internal`**

Structural mirror of node-llama-cpp v3's `ChatHistoryItem`.
A `'model'` turn carries its text as `response: string[]`.
