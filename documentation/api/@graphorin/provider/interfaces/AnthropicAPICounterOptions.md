[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / AnthropicAPICounterOptions

# Interface: AnthropicAPICounterOptions

Defined in: [packages/provider/src/counters/anthropic.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/anthropic.ts#L22)

Options for [AnthropicAPICounter](/api/@graphorin/provider/classes/AnthropicAPICounter.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-apikey"></a> `apiKey?` | `readonly` | `string` | - | [packages/provider/src/counters/anthropic.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/anthropic.ts#L24) |
| <a id="property-baseurl"></a> `baseUrl?` | `readonly` | `string` | - | [packages/provider/src/counters/anthropic.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/anthropic.ts#L25) |
| <a id="property-fetchimpl"></a> `fetchImpl?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | - | [packages/provider/src/counters/anthropic.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/anthropic.ts#L26) |
| <a id="property-id"></a> `id?` | `readonly` | `string` | Identifier carried on the produced counter. | [packages/provider/src/counters/anthropic.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/anthropic.ts#L28) |
| <a id="property-logger"></a> `logger?` | `readonly` | (`message`, `meta?`) => `void` | Log sink for the WARN emitted (once per counter) when the native call degrades to the tiktoken fallback. Defaults to `console.warn`. | [packages/provider/src/counters/anthropic.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/anthropic.ts#L33) |
| <a id="property-modelid"></a> `modelId` | `readonly` | `string` | - | [packages/provider/src/counters/anthropic.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/anthropic.ts#L23) |
