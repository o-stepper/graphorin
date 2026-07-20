[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider-llamacpp-node](/api/@graphorin/provider-llamacpp-node/index.md) / [](/api/@graphorin/provider-llamacpp-node/README.md) / LlamaSessionInstance

# Interface: LlamaSessionInstance

Defined in: src/runtime.ts:49

**`Internal`**

Loaded chat session capable of streaming responses.

## Methods

### dispose()?

```ts
optional dispose(): void;
```

Defined in: src/runtime.ts:73

Release the per-request context / sequence backing this session.
node-llama-cpp contexts hold KV-cache memory (hundreds of MB at
large context sizes); the adapter calls this in a `finally` after
every stream so long-running agents do not leak until OOM.

#### Returns

`void`

***

### promptStreamingResponse()

```ts
promptStreamingResponse(prompt, options?): AsyncIterable<string>;
```

Defined in: src/runtime.ts:50

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `prompt` | `string` |
| `options?` | \{ `maxTokens?`: `number`; `signal?`: `AbortSignal`; `temperature?`: `number`; \} |
| `options.maxTokens?` | `number` |
| `options.signal?` | `AbortSignal` |
| `options.temperature?` | `number` |

#### Returns

`AsyncIterable`\&lt;`string`\&gt;

***

### setChatHistory()?

```ts
optional setChatHistory(history): void;
```

Defined in: src/runtime.ts:66

Replace the session's chat history (node-llama-cpp v3
`setChatHistory`). When present, the adapter feeds multi-turn
transcripts as REAL chat history + prompts only the last user turn
- instead of serialising the whole conversation into one
pseudo-prompt string. Optional: fixtures / custom factories without
it keep the legacy render-prompt path.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `history` | readonly [`LlamaChatHistoryItem`](/api/@graphorin/provider-llamacpp-node/type-aliases/LlamaChatHistoryItem.md)[] |

#### Returns

`void`
