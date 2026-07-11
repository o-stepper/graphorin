[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / buildHydeRequest

# Function: buildHydeRequest()

```ts
function buildHydeRequest(query, options?): ProviderRequest;
```

Defined in: [packages/memory/src/search/query-transform.ts:134](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/query-transform.ts#L134)

Build the HyDE pseudo-document request. Pure - no I/O.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `options` | \{ `maxTokens?`: `number`; `signal?`: `AbortSignal`; \} |
| `options.maxTokens?` | `number` |
| `options.signal?` | `AbortSignal` |

## Returns

[`ProviderRequest`](/api/@graphorin/core/interfaces/ProviderRequest.md)

## Stable
