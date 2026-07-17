[**Graphorin API reference v0.12.1**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/llamacpp-server](/api/@graphorin/provider/adapters/llamacpp-server/index.md) / LlamaCppServerAdapterOptions

# Interface: LlamaCppServerAdapterOptions

Defined in: [packages/provider/src/adapters/llamacpp-server.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/llamacpp-server.ts#L31)

Options accepted by [llamaCppServerAdapter](/api/@graphorin/provider/adapters/llamacpp-server/functions/llamaCppServerAdapter.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acceptssensitivity"></a> `acceptsSensitivity?` | `readonly` | readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[] | Override for the default `acceptsSensitivity` value. | [packages/provider/src/adapters/llamacpp-server.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/llamacpp-server.ts#L56) |
| <a id="property-allowinsecuretransport"></a> `allowInsecureTransport?` | `readonly` | `boolean` | Acknowledge the risk of running over plaintext HTTP against a public host. Without this flag the adapter throws `LocalProviderInsecureTransportError`. | [packages/provider/src/adapters/llamacpp-server.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/llamacpp-server.ts#L54) |
| <a id="property-apikey"></a> `apiKey?` | `readonly` | `string` | Optional bearer-auth API key (`--api-key` flag on the server). | [packages/provider/src/adapters/llamacpp-server.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/llamacpp-server.ts#L37) |
| <a id="property-baseurl"></a> `baseUrl?` | `readonly` | `string` | Base URL of the running `llama-server` process. Defaults to `http://127.0.0.1:8080`. | [packages/provider/src/adapters/llamacpp-server.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/llamacpp-server.ts#L35) |
| <a id="property-capabilities"></a> `capabilities?` | `readonly` | `Partial`\&lt;[`ProviderCapabilities`](/api/@graphorin/core/interfaces/ProviderCapabilities.md)\&gt; | Capability overrides merged on top of the adapter defaults. | [packages/provider/src/adapters/llamacpp-server.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/llamacpp-server.ts#L48) |
| <a id="property-fetchimpl"></a> `fetchImpl?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | Custom `fetch` implementation; useful for tests. | [packages/provider/src/adapters/llamacpp-server.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/llamacpp-server.ts#L41) |
| <a id="property-headers"></a> `headers?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | Extra headers merged on top of `content-type` + `accept` defaults. | [packages/provider/src/adapters/llamacpp-server.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/llamacpp-server.ts#L39) |
| <a id="property-logger"></a> `logger?` | `readonly` | (`level`, `message`, `meta?`) => `void` | Optional log sink. Tests pass a fixture sink to silence the console. | [packages/provider/src/adapters/llamacpp-server.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/llamacpp-server.ts#L60) |
| <a id="property-model"></a> `model` | `readonly` | `string` | GGUF model identifier exposed by the running server (e.g. `'qwen2.5:7b-instruct-q4_k_m'`). | [packages/provider/src/adapters/llamacpp-server.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/llamacpp-server.ts#L33) |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Provider name attached to spans / log lines. | [packages/provider/src/adapters/llamacpp-server.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/llamacpp-server.ts#L58) |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Time-to-response budget per request (PS-24). Default `DEFAULT_REQUEST_TIMEOUT_MS` (120s); `0` disables. | [packages/provider/src/adapters/llamacpp-server.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/llamacpp-server.ts#L46) |
