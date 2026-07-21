[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / JsTiktokenCounterOptions

# Interface: JsTiktokenCounterOptions

Defined in: packages/provider/src/counters/js-tiktoken.ts:63

**`Stable`**

Options for [JsTiktokenCounter](/api/@graphorin/provider/classes/JsTiktokenCounter.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-encoding"></a> `encoding?` | `readonly` | `string` | Encoding name (`'cl100k_base'`, `'o200k_base'`, …). Default `'cl100k_base'`. | packages/provider/src/counters/js-tiktoken.ts:65 |
| <a id="property-id"></a> `id?` | `readonly` | `string` | Identifier carried on the produced counter. | packages/provider/src/counters/js-tiktoken.ts:74 |
| <a id="property-modelid"></a> `modelId?` | `readonly` | `string` | Optional model id used by `encodingForModel`. Falls back to the explicit `encoding`. | packages/provider/src/counters/js-tiktoken.ts:67 |
| <a id="property-moduleoverride"></a> `moduleOverride?` | `readonly` | [`TiktokenModule`](/api/@graphorin/provider/interfaces/TiktokenModule.md) | Override the dynamically-loaded module. Used by tests to inject a stub without taking the real `js-tiktoken` peer dependency. | packages/provider/src/counters/js-tiktoken.ts:72 |
