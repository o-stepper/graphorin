[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / ModelPrice

# Interface: ModelPrice

Defined in: [packages/pricing/src/types.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L17)

Per-model pricing entry. All amounts are in **USD per token** unless
the snapshot declares an alternative currency. Reasoning tokens
(when supported) follow the same pricing as completion tokens unless
the entry declares an explicit `reasoningUsdPerToken`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cachedreadusdpertoken"></a> `cachedReadUsdPerToken?` | `readonly` | `number` | Optional cached-read price (Anthropic / OpenAI prompt caching). | [packages/pricing/src/types.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L27) |
| <a id="property-cachewriteusdpertoken"></a> `cacheWriteUsdPerToken?` | `readonly` | `number` | Optional cache-write (cache-creation) price. Anthropic bills prompt tokens written to the 5-minute cache at 1.25x the input rate; OpenAI does not charge (or report) cache writes, so its entries omit this. | [packages/pricing/src/types.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L33) |
| <a id="property-inputusdpertoken"></a> `inputUsdPerToken` | `readonly` | `number` | Price per input token, in USD. | [packages/pricing/src/types.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L23) |
| <a id="property-model"></a> `model` | `readonly` | `string` | Lower-case model id, e.g. `'claude-3-5-sonnet-20241022'`. | [packages/pricing/src/types.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L21) |
| <a id="property-notes"></a> `notes?` | `readonly` | `string` | Free-form notes for tooling / docs. | [packages/pricing/src/types.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L39) |
| <a id="property-outputusdpertoken"></a> `outputUsdPerToken` | `readonly` | `number` | Price per output token, in USD. | [packages/pricing/src/types.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L25) |
| <a id="property-provider"></a> `provider` | `readonly` | `string` | Lower-case provider id (e.g. `'anthropic'`, `'openai'`, `'ollama'`). | [packages/pricing/src/types.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L19) |
| <a id="property-reasoningusdpertoken"></a> `reasoningUsdPerToken?` | `readonly` | `number` | Optional reasoning-token price (OpenAI o1 / Gemini 2 thinking). | [packages/pricing/src/types.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L35) |
| <a id="property-region"></a> `region?` | `readonly` | `string` | Optional region label (e.g. `'us-east-1'`). | [packages/pricing/src/types.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/types.ts#L37) |
