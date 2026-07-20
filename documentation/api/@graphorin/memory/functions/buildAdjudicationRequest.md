[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / buildAdjudicationRequest

# Function: buildAdjudicationRequest()

```ts
function buildAdjudicationRequest(
   nameA, 
   nameB, 
   options?): ProviderRequest;
```

Defined in: packages/memory/src/graph/entity-resolver.ts:198

Build the (pure) adjudication request. Exposed for testing.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `nameA` | `string` |
| `nameB` | `string` |
| `options` | \{ `signal?`: `AbortSignal`; \} |
| `options.signal?` | `AbortSignal` |

## Returns

[`ProviderRequest`](/api/@graphorin/core/interfaces/ProviderRequest.md)
