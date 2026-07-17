[**Graphorin API reference v0.10.2**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/ollama](/api/@graphorin/provider/adapters/ollama/index.md) / OllamaAdapterOptions

# Interface: OllamaAdapterOptions

Defined in: [packages/provider/src/adapters/ollama.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/ollama.ts#L58)

Options accepted by [ollamaAdapter](/api/@graphorin/provider/adapters/ollama/functions/ollamaAdapter.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acceptssensitivity"></a> `acceptsSensitivity?` | `readonly` | readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[] | - | [packages/provider/src/adapters/ollama.ts:98](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/ollama.ts#L98) |
| <a id="property-allowinsecuretransport"></a> `allowInsecureTransport?` | `readonly` | `boolean` | - | [packages/provider/src/adapters/ollama.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/ollama.ts#L97) |
| <a id="property-baseurl"></a> `baseUrl?` | `readonly` | `string` | - | [packages/provider/src/adapters/ollama.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/ollama.ts#L60) |
| <a id="property-capabilities"></a> `capabilities?` | `readonly` | `Partial`\&lt;[`ProviderCapabilities`](/api/@graphorin/core/interfaces/ProviderCapabilities.md)\&gt; | - | [packages/provider/src/adapters/ollama.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/ollama.ts#L99) |
| <a id="property-chatpath"></a> `chatPath?` | `readonly` | `string` | - | [packages/provider/src/adapters/ollama.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/ollama.ts#L61) |
| <a id="property-fetchimpl"></a> `fetchImpl?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | - | [packages/provider/src/adapters/ollama.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/ollama.ts#L63) |
| <a id="property-headers"></a> `headers?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | - | [packages/provider/src/adapters/ollama.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/ollama.ts#L62) |
| <a id="property-keepalive"></a> `keepAlive?` | `readonly` | `string` \| `number` | How long the server keeps the model loaded after the request, sent as Ollama's top-level `keep_alive` field (e.g. `'10m'`, `-1` for indefinitely). Omitted -> the server default (5m). | [packages/provider/src/adapters/ollama.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/ollama.ts#L96) |
| <a id="property-logger"></a> `logger?` | `readonly` | (`level`, `message`, `meta?`) => `void` | - | [packages/provider/src/adapters/ollama.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/ollama.ts#L101) |
| <a id="property-model"></a> `model` | `readonly` | `string` | - | [packages/provider/src/adapters/ollama.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/ollama.ts#L59) |
| <a id="property-name"></a> `name?` | `readonly` | `string` | - | [packages/provider/src/adapters/ollama.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/ollama.ts#L100) |
| <a id="property-numctx"></a> `numCtx?` | `readonly` | `number` | Context window to request from the Ollama server, sent as `options.num_ctx` on every call (audit 2026-07-16, P1-5). Without it Ollama sizes the context itself (4096 by default) while this adapter declares `capabilities.contextWindow` 8192 - three numbers that silently disagree. Setting `numCtx` uses ONE value for both the server request and `capabilities.contextWindow` (an explicit `capabilities.contextWindow` override still wins). | [packages/provider/src/adapters/ollama.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/ollama.ts#L90) |
| <a id="property-think"></a> `think?` | `readonly` | `boolean` \| `"low"` \| `"medium"` \| `"high"` | Thinking control for reasoning-capable models (audit 2026-07-16, P1-4). Sent as Ollama's top-level `think` field: `false` disables thinking on models that default to it (e.g. qwen3), `true` enables it, and `'low' | 'medium' | 'high'` select an effort level on models that grade it (e.g. gpt-oss). Omitted -> the model's own default. Any truthy value also flips `capabilities.reasoning` to `true` unless an explicit `capabilities` override says otherwise. Streamed `message.thinking` chunks are normalized into `reasoning-delta` events either way. | [packages/provider/src/adapters/ollama.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/ollama.ts#L80) |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Time-to-response budget per request (PS-24). Default `DEFAULT_REQUEST_TIMEOUT_MS` (120s); `0` disables. | [packages/provider/src/adapters/ollama.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/ollama.ts#L68) |
