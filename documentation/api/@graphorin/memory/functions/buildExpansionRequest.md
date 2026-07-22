[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / buildExpansionRequest

# Function: buildExpansionRequest()

```ts
function buildExpansionRequest(
   query, 
   count, 
   options?): ProviderRequest;
```

Defined in: packages/memory/src/search/query-transform.ts:109

**`Stable`**

Build the multi-query expansion request. Pure - no I/O. A higher
temperature is used deliberately so the variants diverge (the
downstream retrieval + RRF fusion stays deterministic).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `count` | `number` |
| `options` | \{ `maxTokens?`: `number`; `signal?`: `AbortSignal`; \} |
| `options.maxTokens?` | `number` |
| `options.signal?` | `AbortSignal` |

## Returns

[`ProviderRequest`](/api/@graphorin/core/interfaces/ProviderRequest.md)
