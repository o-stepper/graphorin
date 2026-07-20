[**Graphorin API reference v0.13.3**](../../../index.md)

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
  meta?: ReasoningContentMeta;
  type: "reasoning-end";
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
  providerMetadata?: Readonly<Record<string, unknown>>;
  type: "finish";
  usage: Usage;
}
  | {
  error: ProviderError;
  type: "error";
};
```

Defined in: packages/core/src/contracts/provider.ts:172

**`Stable`**

Streamed provider event. Shape matches the wire-stable subset of the
provider event union - adapters hide vendor specifics.

## Union Members

### Type Literal

```ts
{
  metadata: ResponseMetadata;
  type: "stream-start";
}
```

***

### Type Literal

```ts
{
  delta: string;
  type: "reasoning-delta";
}
```

***

### Type Literal

```ts
{
  meta?: ReasoningContentMeta;
  type: "reasoning-end";
}
```

Closes the current reasoning block. Deltas stay textual;
this terminator carries the provider's opaque round-trip metadata
(e.g. the Anthropic thinking-block `signature`, or `data` for a
redacted block) so multi-step tool use with extended thinking can
replay the block byte-equal on the next request. Adapters without
per-block structure simply never emit it - consumers fall back to
collapsing the deltas.

***

### Type Literal

```ts
{
  delta: string;
  type: "text-delta";
}
```

***

### Type Literal

```ts
{
  toolCallId: string;
  toolName: string;
  type: "tool-call-start";
}
```

***

### Type Literal

```ts
{
  argsDelta: string;
  toolCallId: string;
  type: "tool-call-input-delta";
}
```

***

### Type Literal

```ts
{
  finalArgs: unknown;
  toolCallId: string;
  type: "tool-call-end";
}
```

***

### Type Literal

```ts
{
  data: Uint8Array;
  mimeType: string;
  type: "file";
}
```

***

### Type Literal

```ts
{
  title?: string;
  type: "source";
  uri: string;
}
```

***

### Type Literal

```ts
{
  finishReason: FinishReason;
  providerMetadata?: Readonly<Record<string, unknown>>;
  type: "finish";
  usage: Usage;
}
```

Terminal event. `providerMetadata` mirrors
[ProviderResponse.providerMetadata](/api/@graphorin/core/interfaces/ProviderResponse.md#property-providermetadata) for the streaming path:
an optional vendor-namespaced diagnostic payload (e.g. the Ollama
adapter reports `{ ollama: { loadMs, promptEvalMs, evalMs,
totalMs } }` from the server's timing fields, so model load,
prompt processing and generation are distinguishable).
Adapters without such a payload simply omit the field.

***

### Type Literal

```ts
{
  error: ProviderError;
  type: "error";
}
```
