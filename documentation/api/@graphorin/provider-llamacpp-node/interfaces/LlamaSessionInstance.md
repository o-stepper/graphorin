[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider-llamacpp-node](/api/@graphorin/provider-llamacpp-node/index.md) / LlamaSessionInstance

# Interface: LlamaSessionInstance

Defined in: runtime.ts:38

**`Internal`**

Loaded chat session capable of streaming responses.

## Methods

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
