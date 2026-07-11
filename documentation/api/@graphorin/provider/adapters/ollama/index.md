[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / adapters/ollama

# adapters/ollama

Direct adapter for the Ollama HTTP API. The adapter speaks the
native Ollama streaming JSON protocol (`POST /api/chat` returning
newline-delimited JSON objects). For operators who prefer the
OpenAI-compatible variant exposed by recent Ollama releases, the
generic `openAICompatibleAdapter` is the better choice - both
adapters share the same `LocalProviderTrust` classifier and
[LocalProviderInsecureTransportError](/api/@graphorin/provider/classes/LocalProviderInsecureTransportError.md) startup behaviour.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [OllamaAdapterOptions](/api/@graphorin/provider/adapters/ollama/interfaces/OllamaAdapterOptions.md) | Options accepted by [ollamaAdapter](/api/@graphorin/provider/adapters/ollama/functions/ollamaAdapter.md). |

## Variables

| Variable | Description |
| ------ | ------ |
| [DEFAULT\_OLLAMA\_BASE\_URL](/api/@graphorin/provider/adapters/ollama/variables/DEFAULT_OLLAMA_BASE_URL.md) | Default Ollama base URL. |

## Functions

| Function | Description |
| ------ | ------ |
| [ollamaAdapter](/api/@graphorin/provider/adapters/ollama/functions/ollamaAdapter.md) | Build a Graphorin [Provider](/api/@graphorin/core/interfaces/Provider.md) backed by Ollama's native HTTP API. The adapter is fail-safe by default: public-cleartext URLs refuse to start with `LocalProviderInsecureTransportError`. |
