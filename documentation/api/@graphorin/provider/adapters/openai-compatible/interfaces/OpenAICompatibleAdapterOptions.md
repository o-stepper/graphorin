[**Graphorin API reference v0.13.13**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/openai-compatible](/api/@graphorin/provider/adapters/openai-compatible/index.md) / OpenAICompatibleAdapterOptions

# Interface: OpenAICompatibleAdapterOptions

Defined in: packages/provider/src/adapters/openai-compatible.ts:31

**`Stable`**

Options accepted by [openAICompatibleAdapter](/api/@graphorin/provider/adapters/openai-compatible/functions/openAICompatibleAdapter.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acceptssensitivity"></a> `acceptsSensitivity?` | `readonly` | readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[] | Override for the default `acceptsSensitivity` value. | packages/provider/src/adapters/openai-compatible.ts:95 |
| <a id="property-allowinsecuretransport"></a> `allowInsecureTransport?` | `readonly` | `boolean` | Acknowledge the risk of running over plaintext HTTP against a public host. | packages/provider/src/adapters/openai-compatible.ts:80 |
| <a id="property-apikey"></a> `apiKey?` | `readonly` | `string` | Optional bearer-auth API key. | packages/provider/src/adapters/openai-compatible.ts:71 |
| <a id="property-baseurl"></a> `baseUrl` | `readonly` | `string` | Base URL of the OpenAI-compatible server. The classifier inspects the protocol + host to assign a `LocalProviderTrust` value. | packages/provider/src/adapters/openai-compatible.ts:38 |
| <a id="property-capabilities"></a> `capabilities?` | `readonly` | `Partial`\&lt;[`ProviderCapabilities`](/api/@graphorin/core/interfaces/ProviderCapabilities.md)\&gt; | Capability overrides merged on top of the adapter defaults. Use them to widen `contextWindow` / `maxOutput` for large-context servers or to set `structuredOutput: false` for servers that reject `response_format`. | packages/provider/src/adapters/openai-compatible.ts:88 |
| <a id="property-chatpath"></a> `chatPath?` | `readonly` | `string` | Optional REST path override, appended to `baseUrl` verbatim. Defaults to `/v1/chat/completions`, or to `/chat/completions` when `baseUrl` already ends with `/v1` (the `api.openai.com/v1` / LM Studio / vLLM convention), so both base-URL styles reach the server's single real endpoint. | packages/provider/src/adapters/openai-compatible.ts:46 |
| <a id="property-fetchimpl"></a> `fetchImpl?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | Custom `fetch` implementation; useful for tests. | packages/provider/src/adapters/openai-compatible.ts:75 |
| <a id="property-headers"></a> `headers?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | Extra headers merged on top of `content-type` + `accept` defaults. | packages/provider/src/adapters/openai-compatible.ts:73 |
| <a id="property-logger"></a> `logger?` | `readonly` | (`level`, `message`, `meta?`) => `void` | Optional log sink. | packages/provider/src/adapters/openai-compatible.ts:99 |
| <a id="property-model"></a> `model` | `readonly` | `string` | Model identifier sent in the request body's `model` field. | packages/provider/src/adapters/openai-compatible.ts:33 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Provider name attached to spans / log lines. | packages/provider/src/adapters/openai-compatible.ts:97 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Time-to-response budget per request. Default 120s; `0` disables. | packages/provider/src/adapters/openai-compatible.ts:93 |
| <a id="property-tokenlimitparam"></a> `tokenLimitParam?` | `readonly` | [`TokenLimitParam`](/api/@graphorin/provider/type-aliases/TokenLimitParam.md) | Which wire parameter carries `maxTokens`: classic `'max_tokens'` (default; llama.cpp, LM Studio, vLLM, LocalAI) or `'max_completion_tokens'` (current OpenAI models, which reject the classic name with HTTP 400). When left unset, the adapter reacts to that specific 400 by re-sending the request once with `max_completion_tokens` and remembers the switch for the lifetime of the provider instance; setting the option pins the name and disables the auto-remap. | packages/provider/src/adapters/openai-compatible.ts:57 |
| <a id="property-unsupportedparamrecovery"></a> `unsupportedParamRecovery?` | `readonly` | [`UnsupportedParamRecovery`](/api/@graphorin/provider/type-aliases/UnsupportedParamRecovery.md) | One-shot HTTP 400 auto-recovery for model parameters the server rejects: a 400 naming `temperature` re-sends the request without the field (current OpenAI reasoning models accept only the default), and a 400 requiring `reasoning_effort` `'none'` for function tools on chat completions re-sends with it. The instance keeps each switch and WARNs once. An explicit `providerOptions` value for either field disables its recovery so the override keeps failing loudly. Default `'auto'`; set `'off'` to surface the original errors instead. | packages/provider/src/adapters/openai-compatible.ts:69 |
