[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createProviderRetrievalGrader

# Function: createProviderRetrievalGrader()

```ts
function createProviderRetrievalGrader(provider, options?): RetrievalGrader;
```

Defined in: packages/memory/src/search/iterative.ts:310

Wrap a [Provider](/api/@graphorin/core/interfaces/Provider.md) as a [RetrievalGrader](/api/@graphorin/memory/interfaces/RetrievalGrader.md). **Resilient**: a
provider error or unparseable response degrades to the
[parseGrade](/api/@graphorin/memory/functions/parseGrade.md) "stop" grade so grading never throws into the loop
(and a flaky grader can't drive endless reformulation).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `provider` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) |
| `options` | \{ `maxTokens?`: `number`; \} |
| `options.maxTokens?` | `number` |

## Returns

[`RetrievalGrader`](/api/@graphorin/memory/interfaces/RetrievalGrader.md)

## Stable
