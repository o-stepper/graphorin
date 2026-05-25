[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / buildGradeRequest

# Function: buildGradeRequest()

```ts
function buildGradeRequest(
   query, 
   snippets, 
   options?): ProviderRequest;
```

Defined in: packages/memory/src/search/iterative.ts:232

Build the grade request. Pure — no I/O. Temperature 0 so the verdict
is as stable as the model allows.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `snippets` | readonly `string`[] |
| `options` | \{ `maxTokens?`: `number`; `signal?`: `AbortSignal`; \} |
| `options.maxTokens?` | `number` |
| `options.signal?` | `AbortSignal` |

## Returns

[`ProviderRequest`](/api/@graphorin/core/interfaces/ProviderRequest.md)

## Stable
