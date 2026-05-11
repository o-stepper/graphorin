[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProviderEvent

# Type Alias: ProviderEvent

```ts
type ProviderEvent = 
  | {
  metadata: ResponseMetadata;
  type: "stream-start";
}
  | {
  delta: string;
  type: "reasoning-delta";
}
  | {
  delta: string;
  type: "text-delta";
}
  | {
  toolCallId: string;
  toolName: string;
  type: "tool-call-start";
}
  | {
  argsDelta: string;
  toolCallId: string;
  type: "tool-call-input-delta";
}
  | {
  finalArgs: unknown;
  toolCallId: string;
  type: "tool-call-end";
}
  | {
  data: Uint8Array;
  mimeType: string;
  type: "file";
}
  | {
  title?: string;
  type: "source";
  uri: string;
}
  | {
  finishReason: FinishReason;
  type: "finish";
  usage: Usage;
}
  | {
  error: ProviderError;
  type: "error";
};
```

Defined in: packages/core/src/contracts/provider.ts:144

Streamed provider event. Shape matches the wire-stable subset of the
provider event union — adapters hide vendor specifics.

## Stable
