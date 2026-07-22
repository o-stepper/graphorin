[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / AnthropicAPICounterOptions

# Interface: AnthropicAPICounterOptions

Defined in: packages/provider/src/counters/anthropic.ts:22

**`Stable`**

Options for [AnthropicAPICounter](/api/@graphorin/provider/classes/AnthropicAPICounter.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-apikey"></a> `apiKey?` | `readonly` | `string` | - | packages/provider/src/counters/anthropic.ts:24 |
| <a id="property-baseurl"></a> `baseUrl?` | `readonly` | `string` | - | packages/provider/src/counters/anthropic.ts:25 |
| <a id="property-fetchimpl"></a> `fetchImpl?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | - | packages/provider/src/counters/anthropic.ts:26 |
| <a id="property-id"></a> `id?` | `readonly` | `string` | Identifier carried on the produced counter. | packages/provider/src/counters/anthropic.ts:28 |
| <a id="property-logger"></a> `logger?` | `readonly` | (`message`, `meta?`) => `void` | Log sink for the WARN emitted (once per counter) when the native call degrades to the tiktoken fallback. Defaults to `console.warn`. | packages/provider/src/counters/anthropic.ts:33 |
| <a id="property-modelid"></a> `modelId` | `readonly` | `string` | - | packages/provider/src/counters/anthropic.ts:23 |
