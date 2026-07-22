[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ExecutorEvent

# Type Alias: ExecutorEvent

```ts
type ExecutorEvent = 
  | ToolExecuteStartEvent
  | ToolExecuteEndEvent
  | ToolExecuteErrorEvent
  | StreamingEvent;
```

Defined in: packages/tools/src/executor/types.ts:38

Union of `tool.execute.*` events the executor forwards through `streamingSink`.
