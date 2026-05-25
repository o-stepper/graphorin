[**Graphorin API reference v0.4.0**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/ollama](/api/@graphorin/provider/adapters/ollama/index.md) / OllamaAdapterOptions

# Interface: OllamaAdapterOptions

Defined in: packages/provider/src/adapters/ollama.ts:47

Options accepted by [ollamaAdapter](/api/@graphorin/provider/adapters/ollama/functions/ollamaAdapter.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-acceptssensitivity"></a> `acceptsSensitivity?` | `readonly` | readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[] | packages/provider/src/adapters/ollama.ts:54 |
| <a id="property-allowinsecuretransport"></a> `allowInsecureTransport?` | `readonly` | `boolean` | packages/provider/src/adapters/ollama.ts:53 |
| <a id="property-baseurl"></a> `baseUrl?` | `readonly` | `string` | packages/provider/src/adapters/ollama.ts:49 |
| <a id="property-capabilities"></a> `capabilities?` | `readonly` | `Partial`\&lt;[`ProviderCapabilities`](/api/@graphorin/core/interfaces/ProviderCapabilities.md)\&gt; | packages/provider/src/adapters/ollama.ts:55 |
| <a id="property-chatpath"></a> `chatPath?` | `readonly` | `string` | packages/provider/src/adapters/ollama.ts:50 |
| <a id="property-fetchimpl"></a> `fetchImpl?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | packages/provider/src/adapters/ollama.ts:52 |
| <a id="property-headers"></a> `headers?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | packages/provider/src/adapters/ollama.ts:51 |
| <a id="property-logger"></a> `logger?` | `readonly` | (`level`, `message`, `meta?`) => `void` | packages/provider/src/adapters/ollama.ts:57 |
| <a id="property-model"></a> `model` | `readonly` | `string` | packages/provider/src/adapters/ollama.ts:48 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | packages/provider/src/adapters/ollama.ts:56 |
