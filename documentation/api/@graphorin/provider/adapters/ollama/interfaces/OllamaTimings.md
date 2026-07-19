[**Graphorin API reference v0.12.1**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/ollama](/api/@graphorin/provider/adapters/ollama/index.md) / OllamaTimings

# Interface: OllamaTimings

Defined in: packages/provider/src/adapters/ollama.ts:427

**`Stable`**

Ollama server timings for one call, in milliseconds (audit
2026-07-16, item 8). The server reports them in nanoseconds on the
terminal chunk; normalized here so model load, prompt processing and
generation are distinguishable in events and traces. Surfaced under
`providerMetadata.ollama` on the `finish` event / `generate()`
response, and stamped onto the provider span by `withTracing`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-evalms"></a> `evalMs?` | `readonly` | `number` | Token-generation time. | packages/provider/src/adapters/ollama.ts:435 |
| <a id="property-loadms"></a> `loadMs?` | `readonly` | `number` | Time spent loading the model (0 when already resident). | packages/provider/src/adapters/ollama.ts:431 |
| <a id="property-promptevalms"></a> `promptEvalMs?` | `readonly` | `number` | Prompt-processing time. | packages/provider/src/adapters/ollama.ts:433 |
| <a id="property-totalms"></a> `totalMs?` | `readonly` | `number` | Wall clock for the whole call. | packages/provider/src/adapters/ollama.ts:429 |
