[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / ModelPrice

# Interface: ModelPrice

Defined in: pricing/src/types.ts:17

**`Stable`**

Per-model pricing entry. All amounts are in **USD per token** unless
the snapshot declares an alternative currency. Reasoning tokens
(when supported) follow the same pricing as completion tokens unless
the entry declares an explicit `reasoningUsdPerToken`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cachedreadusdpertoken"></a> `cachedReadUsdPerToken?` | `readonly` | `number` | Optional cached-read price (Anthropic / OpenAI prompt caching). | pricing/src/types.ts:27 |
| <a id="property-cachewriteusdpertoken"></a> `cacheWriteUsdPerToken?` | `readonly` | `number` | Optional cache-write (cache-creation) price. Anthropic bills prompt tokens written to the 5-minute cache at 1.25x the input rate; OpenAI does not charge (or report) cache writes, so its entries omit this. | pricing/src/types.ts:33 |
| <a id="property-inputusdpertoken"></a> `inputUsdPerToken` | `readonly` | `number` | Price per input token, in USD. | pricing/src/types.ts:23 |
| <a id="property-model"></a> `model` | `readonly` | `string` | Lower-case model id, e.g. `'claude-3-5-sonnet-20241022'`. | pricing/src/types.ts:21 |
| <a id="property-notes"></a> `notes?` | `readonly` | `string` | Free-form notes for tooling / docs. | pricing/src/types.ts:39 |
| <a id="property-outputusdpertoken"></a> `outputUsdPerToken` | `readonly` | `number` | Price per output token, in USD. | pricing/src/types.ts:25 |
| <a id="property-provider"></a> `provider` | `readonly` | `string` | Lower-case provider id (e.g. `'anthropic'`, `'openai'`, `'ollama'`). | pricing/src/types.ts:19 |
| <a id="property-reasoningusdpertoken"></a> `reasoningUsdPerToken?` | `readonly` | `number` | Optional reasoning-token price (OpenAI o1 / Gemini 2 thinking). | pricing/src/types.ts:35 |
| <a id="property-region"></a> `region?` | `readonly` | `string` | Optional region label (e.g. `'us-east-1'`). | pricing/src/types.ts:37 |
