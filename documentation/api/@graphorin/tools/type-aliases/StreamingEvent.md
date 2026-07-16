[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / StreamingEvent

# Type Alias: StreamingEvent

```ts
type StreamingEvent = 
  | ToolExecuteProgressEvent
  | ToolExecutePartialEvent;
```

Defined in: [packages/tools/src/streaming/channel.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/streaming/channel.ts#L27)

Discriminated union of streaming events the channel forwards.
