[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / StreamMode

# Type Alias: StreamMode

```ts
type StreamMode = 
  | "values"
  | "updates"
  | "messages"
  | "tasks"
  | "checkpoints"
  | "debug"
  | "custom";
```

Defined in: [packages/workflow/src/types.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L67)

Stream emission modes accepted by `workflow.execute(input, { stream })`.
The default is `values`. The `messages` mode is reserved for future
tighter integration with the LLM message channel and currently
behaves as `updates`.

## Stable
