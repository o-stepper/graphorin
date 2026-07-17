[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / CreateDefaultCounterOptions

# Interface: CreateDefaultCounterOptions

Defined in: [packages/provider/src/counters/dispatcher.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/dispatcher.ts#L24)

Options for [createDefaultCounter](/api/@graphorin/provider/functions/createDefaultCounter.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-anthropicapikey"></a> `anthropicApiKey?` | `readonly` | `string` | Optional Anthropic API key threaded through to [AnthropicAPICounter](/api/@graphorin/provider/classes/AnthropicAPICounter.md). | [packages/provider/src/counters/dispatcher.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/dispatcher.ts#L30) |
| <a id="property-model"></a> `model` | `readonly` | `string` | Concrete model id (e.g. `'gpt-4o'`, `'claude-opus-4-7'`). | [packages/provider/src/counters/dispatcher.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/dispatcher.ts#L26) |
| <a id="property-provider"></a> `provider?` | `readonly` | `string` | Optional provider hint to short-circuit the regex matching. | [packages/provider/src/counters/dispatcher.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/counters/dispatcher.ts#L28) |
