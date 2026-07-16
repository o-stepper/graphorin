[**Graphorin API reference v0.10.0**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/llamacpp-server](/api/@graphorin/provider/adapters/llamacpp-server/index.md) / llamaCppServerAdapter

# Function: llamaCppServerAdapter()

```ts
function llamaCppServerAdapter(options): Provider;
```

Defined in: [packages/provider/src/adapters/llamacpp-server.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/adapters/llamacpp-server.ts#L81)

Build a Graphorin [Provider](/api/@graphorin/core/interfaces/Provider.md) backed by the upstream
`llama-server` binary. The factory does not start the binary -
operators launch it themselves with the desired model + GPU flags
and pass the URL here.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LlamaCppServerAdapterOptions`](/api/@graphorin/provider/adapters/llamacpp-server/interfaces/LlamaCppServerAdapterOptions.md) |

## Returns

[`Provider`](/api/@graphorin/core/interfaces/Provider.md)

## Example

```ts
const local = createProvider(
  llamaCppServerAdapter({
    model: 'qwen2.5:7b-instruct-q4_k_m',
    baseUrl: 'http://127.0.0.1:8080',
  }),
);
```

## Stable
