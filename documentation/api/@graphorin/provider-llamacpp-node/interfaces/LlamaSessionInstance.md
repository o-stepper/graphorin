[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider-llamacpp-node](/api/@graphorin/provider-llamacpp-node/index.md) / LlamaSessionInstance

# Interface: LlamaSessionInstance

Defined in: runtime.ts:38

**`Internal`**

Loaded chat session capable of streaming responses.

## Methods

### dispose()?

```ts
optional dispose(): void;
```

Defined in: runtime.ts:53

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

Defined in: runtime.ts:39

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
