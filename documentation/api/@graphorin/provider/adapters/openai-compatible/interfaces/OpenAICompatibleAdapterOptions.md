[**Graphorin API reference v0.13.5**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/openai-compatible](/api/@graphorin/provider/adapters/openai-compatible/index.md) / OpenAICompatibleAdapterOptions

# Interface: OpenAICompatibleAdapterOptions

Defined in: packages/provider/src/adapters/openai-compatible.ts:25

**`Stable`**

Options accepted by [openAICompatibleAdapter](/api/@graphorin/provider/adapters/openai-compatible/functions/openAICompatibleAdapter.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acceptssensitivity"></a> `acceptsSensitivity?` | `readonly` | readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[] | Override for the default `acceptsSensitivity` value. | packages/provider/src/adapters/openai-compatible.ts:60 |
| <a id="property-allowinsecuretransport"></a> `allowInsecureTransport?` | `readonly` | `boolean` | Acknowledge the risk of running over plaintext HTTP against a public host. | packages/provider/src/adapters/openai-compatible.ts:45 |
| <a id="property-apikey"></a> `apiKey?` | `readonly` | `string` | Optional bearer-auth API key. | packages/provider/src/adapters/openai-compatible.ts:36 |
| <a id="property-baseurl"></a> `baseUrl` | `readonly` | `string` | Base URL of the OpenAI-compatible server. The classifier inspects the protocol + host to assign a `LocalProviderTrust` value. | packages/provider/src/adapters/openai-compatible.ts:32 |
| <a id="property-capabilities"></a> `capabilities?` | `readonly` | `Partial`\&lt;[`ProviderCapabilities`](/api/@graphorin/core/interfaces/ProviderCapabilities.md)\&gt; | Capability overrides merged on top of the adapter defaults. Use them to widen `contextWindow` / `maxOutput` for large-context servers or to set `structuredOutput: false` for servers that reject `response_format`. | packages/provider/src/adapters/openai-compatible.ts:53 |
| <a id="property-chatpath"></a> `chatPath?` | `readonly` | `string` | Optional REST path override. Defaults to `/v1/chat/completions`. | packages/provider/src/adapters/openai-compatible.ts:34 |
| <a id="property-fetchimpl"></a> `fetchImpl?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | Custom `fetch` implementation; useful for tests. | packages/provider/src/adapters/openai-compatible.ts:40 |
| <a id="property-headers"></a> `headers?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | Extra headers merged on top of `content-type` + `accept` defaults. | packages/provider/src/adapters/openai-compatible.ts:38 |
| <a id="property-logger"></a> `logger?` | `readonly` | (`level`, `message`, `meta?`) => `void` | Optional log sink. | packages/provider/src/adapters/openai-compatible.ts:64 |
| <a id="property-model"></a> `model` | `readonly` | `string` | Model identifier sent in the request body's `model` field. | packages/provider/src/adapters/openai-compatible.ts:27 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Provider name attached to spans / log lines. | packages/provider/src/adapters/openai-compatible.ts:62 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Time-to-response budget per request. Default 120s; `0` disables. | packages/provider/src/adapters/openai-compatible.ts:58 |
