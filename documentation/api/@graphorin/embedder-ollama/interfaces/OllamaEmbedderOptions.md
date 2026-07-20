[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/embedder-ollama](/api/@graphorin/embedder-ollama/index.md) / [](/api/@graphorin/embedder-ollama/README.md) / OllamaEmbedderOptions

# Interface: OllamaEmbedderOptions

Defined in: packages/embedder-ollama/src/index.ts:37

**`Stable`**

Options accepted by [createOllamaEmbedder](/api/@graphorin/embedder-ollama/functions/createOllamaEmbedder.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-baseurl"></a> `baseUrl?` | `readonly` | `string` | Default `'http://127.0.0.1:11434'`. | packages/embedder-ollama/src/index.ts:41 |
| <a id="property-digest"></a> `digest?` | `readonly` | `string` | Optional pre-resolved digest (e.g. from a probe done elsewhere). When set, the embedder uses this value instead of issuing a `POST /api/show` request. | packages/embedder-ollama/src/index.ts:65 |
| <a id="property-dim"></a> `dim?` | `readonly` | `number` | Optional dimensionality hint. When known up-front, the canonical id is stable from the first `embed()` call instead of being resolved from the response. | packages/embedder-ollama/src/index.ts:47 |
| <a id="property-embedpath"></a> `embedPath?` | `readonly` | `string` | Optional API path override (default `'/api/embed'`). | packages/embedder-ollama/src/index.ts:67 |
| <a id="property-fetchimpl"></a> `fetchImpl?` | `readonly` | (`input`, `init?`) => `Promise`\&lt;`Response`\&gt; | Override `fetch`. Used by the test suite to inject a mock HTTP fixture. Production callers should leave this unset so the embedder uses the platform's `globalThis.fetch`. | packages/embedder-ollama/src/index.ts:53 |
| <a id="property-legacyembedpath"></a> `legacyEmbedPath?` | `readonly` | `string` | Optional API path override (default `'/api/embeddings'`). | packages/embedder-ollama/src/index.ts:69 |
| <a id="property-model"></a> `model?` | `readonly` | `string` | Default `'nomic-embed-text'`. | packages/embedder-ollama/src/index.ts:39 |
| <a id="property-showpath"></a> `showPath?` | `readonly` | `string` | Optional API path override (default `'/api/show'`). | packages/embedder-ollama/src/index.ts:71 |
| <a id="property-skipdigestprobe"></a> `skipDigestProbe?` | `readonly` | `boolean` | If `true`, skip the `POST /api/show` model-digest probe at construction. Used in test fixtures where the digest is pre-populated. | packages/embedder-ollama/src/index.ts:59 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Per-request hard timeout in milliseconds. Default `30000`. Each HTTP call (`/api/show`, `/api/embed`, legacy `/api/embeddings`) is aborted if the Ollama daemon does not respond in time, so a hung daemon never stalls the caller. A per-call [EmbedOptions.signal](/api/@graphorin/core/interfaces/EmbedOptions.md#property-signal) is combined with this timeout. Set to `0` to disable. | packages/embedder-ollama/src/index.ts:79 |
