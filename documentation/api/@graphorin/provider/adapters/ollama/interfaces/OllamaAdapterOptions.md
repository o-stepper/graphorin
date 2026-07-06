[**Graphorin API reference v0.6.1**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/ollama](/api/@graphorin/provider/adapters/ollama/index.md) / OllamaAdapterOptions

# Interface: OllamaAdapterOptions

Defined in: packages/provider/src/adapters/ollama.ts:54

Options accepted by [ollamaAdapter](/api/@graphorin/provider/adapters/ollama/functions/ollamaAdapter.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acceptssensitivity"></a> `acceptsSensitivity?` | `readonly` | readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[] | - | packages/provider/src/adapters/ollama.ts:66 |
| <a id="property-allowinsecuretransport"></a> `allowInsecureTransport?` | `readonly` | `boolean` | - | packages/provider/src/adapters/ollama.ts:65 |
| <a id="property-baseurl"></a> `baseUrl?` | `readonly` | `string` | - | packages/provider/src/adapters/ollama.ts:56 |
| <a id="property-capabilities"></a> `capabilities?` | `readonly` | `Partial`\&lt;[`ProviderCapabilities`](/api/@graphorin/core/interfaces/ProviderCapabilities.md)\&gt; | - | packages/provider/src/adapters/ollama.ts:67 |
| <a id="property-chatpath"></a> `chatPath?` | `readonly` | `string` | - | packages/provider/src/adapters/ollama.ts:57 |
| <a id="property-fetchimpl"></a> `fetchImpl?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | - | packages/provider/src/adapters/ollama.ts:59 |
| <a id="property-headers"></a> `headers?` | `readonly` | `Readonly`\&lt;`Record`\&lt;`string`, `string`\&gt;\&gt; | - | packages/provider/src/adapters/ollama.ts:58 |
| <a id="property-logger"></a> `logger?` | `readonly` | (`level`, `message`, `meta?`) => `void` | - | packages/provider/src/adapters/ollama.ts:69 |
| <a id="property-model"></a> `model` | `readonly` | `string` | - | packages/provider/src/adapters/ollama.ts:55 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | - | packages/provider/src/adapters/ollama.ts:68 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Time-to-response budget per request (PS-24). Default `DEFAULT_REQUEST_TIMEOUT_MS` (120s); `0` disables. | packages/provider/src/adapters/ollama.ts:64 |
