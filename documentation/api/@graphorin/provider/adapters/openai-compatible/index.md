[**Graphorin API reference v0.5.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / adapters/openai-compatible

# adapters/openai-compatible

Generic OpenAI-compatible adapter — works against any HTTP server
that speaks the `/v1/chat/completions` REST contract. Tested
deployments include LMStudio (default port 1234), LocalAI (default
port 8080), vLLM (`python -m vllm.entrypoints.openai.api_server`,
default port 8000), Together-style self-host endpoints, and any
other server in the OpenAI-compatible ecosystem.

The adapter shares the same `LocalProviderTrust` classifier as
`ollamaAdapter` and `llamaCppServerAdapter` — one classifier, one
policy table, one error type.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [OpenAICompatibleAdapterOptions](/api/@graphorin/provider/adapters/openai-compatible/interfaces/OpenAICompatibleAdapterOptions.md) | Options accepted by [openAICompatibleAdapter](/api/@graphorin/provider/adapters/openai-compatible/functions/openAICompatibleAdapter.md). |

## Functions

| Function | Description |
| ------ | ------ |
| [openAICompatibleAdapter](/api/@graphorin/provider/adapters/openai-compatible/functions/openAICompatibleAdapter.md) | Build a Graphorin [Provider](/api/@graphorin/core/interfaces/Provider.md) backed by an OpenAI-compatible HTTP server. The same code path serves LMStudio, LocalAI, vLLM, and any other compatible self-host endpoint. |
