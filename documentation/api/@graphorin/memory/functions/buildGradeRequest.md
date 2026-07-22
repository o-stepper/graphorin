[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / buildGradeRequest

# Function: buildGradeRequest()

```ts
function buildGradeRequest(
   query, 
   snippets, 
   options?): ProviderRequest;
```

Defined in: packages/memory/src/search/iterative.ts:241

**`Stable`**

Build the grade request. Pure - no I/O. Temperature 0 so the verdict
is as stable as the model allows.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `snippets` | readonly `string`[] |
| `options` | \{ `maxTokens?`: `number`; `signal?`: `AbortSignal`; `triedQueries?`: readonly `string`[]; \} |
| `options.maxTokens?` | `number` |
| `options.signal?` | `AbortSignal` |
| `options.triedQueries?` | readonly `string`[] |

## Returns

[`ProviderRequest`](/api/@graphorin/core/interfaces/ProviderRequest.md)
