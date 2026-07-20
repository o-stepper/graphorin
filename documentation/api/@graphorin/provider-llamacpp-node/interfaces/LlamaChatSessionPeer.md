[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider-llamacpp-node](/api/@graphorin/provider-llamacpp-node/index.md) / [](/api/@graphorin/provider-llamacpp-node/README.md) / LlamaChatSessionPeer

# Interface: LlamaChatSessionPeer

Defined in: src/runtime.ts:109

**`Internal`**

Structural slice of the peer's `LlamaChatSession` class used by the
default session factory: `prompt(text, { onTextChunk })`
resolves with the full response while streaming chunks through the
callback.

## Methods

### prompt()

```ts
prompt(text, options?): Promise<string>;
```

Defined in: src/runtime.ts:110

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |
| `options?` | \{ `maxTokens?`: `number`; `onTextChunk?`: (`chunk`) => `void`; `signal?`: `AbortSignal`; `temperature?`: `number`; \} |
| `options.maxTokens?` | `number` |
| `options.onTextChunk?` | (`chunk`) => `void` |
| `options.signal?` | `AbortSignal` |
| `options.temperature?` | `number` |

#### Returns

`Promise`\&lt;`string`\&gt;

***

### setChatHistory()?

```ts
optional setChatHistory(history): void;
```

Defined in: src/runtime.ts:120

node-llama-cpp v3 chat-history setter (optional slice).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `history` | readonly [`LlamaChatHistoryItem`](/api/@graphorin/provider-llamacpp-node/type-aliases/LlamaChatHistoryItem.md)[] |

#### Returns

`void`
