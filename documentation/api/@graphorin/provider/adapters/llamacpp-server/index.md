[**Graphorin API reference v0.13.2**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / adapters/llamacpp-server

# adapters/llamacpp-server

Direct adapter for the upstream `llama-server` binary from the
llama.cpp project. The binary speaks the OpenAI-compatible REST
contract end-to-end (`POST /v1/chat/completions`, `POST /v1/completions`,
`POST /v1/embeddings`); streaming is via `text/event-stream` chunks
terminated by `data: [DONE]` exactly as the upstream OpenAI shape.

The adapter shares a single `LocalProviderTrust` classifier with
`ollamaAdapter` and `openAICompatibleAdapter` - one classifier, one
policy table, one error type.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [LlamaCppServerAdapterOptions](/api/@graphorin/provider/adapters/llamacpp-server/interfaces/LlamaCppServerAdapterOptions.md) | Options accepted by [llamaCppServerAdapter](/api/@graphorin/provider/adapters/llamacpp-server/functions/llamaCppServerAdapter.md). |

## Variables

| Variable | Description |
| ------ | ------ |
| [DEFAULT\_LLAMACPP\_SERVER\_BASE\_URL](/api/@graphorin/provider/adapters/llamacpp-server/variables/DEFAULT_LLAMACPP_SERVER_BASE_URL.md) | Default port used by the upstream `llama-server` binary. |

## Functions

| Function | Description |
| ------ | ------ |
| [llamaCppServerAdapter](/api/@graphorin/provider/adapters/llamacpp-server/functions/llamaCppServerAdapter.md) | Build a Graphorin [Provider](/api/@graphorin/core/interfaces/Provider.md) backed by the upstream `llama-server` binary. The factory does not start the binary - operators launch it themselves with the desired model + GPU flags and pass the URL here. |
