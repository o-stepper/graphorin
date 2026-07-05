[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / RetrievalGrader

# Interface: RetrievalGrader

Defined in: packages/memory/src/search/iterative.ts:209

Pluggable retrieval-grader seam consumed by the iterative loop. The
built-in provider-backed implementation lives in
[createProviderRetrievalGrader](/api/@graphorin/memory/functions/createProviderRetrievalGrader.md); advanced callers can supply a
bespoke grader (e.g. a deterministic heuristic).

Implementations MUST degrade gracefully - return a "stop" grade rather
than throw - so a grader failure never breaks recall.

## Stable

## Methods

### grade()

```ts
grade(
   query, 
   snippets, 
options?): Promise<RetrievalGrade>;
```

Defined in: packages/memory/src/search/iterative.ts:210

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `snippets` | readonly `string`[] |
| `options?` | [`RetrievalGradeOptions`](/api/@graphorin/memory/interfaces/RetrievalGradeOptions.md) |

#### Returns

`Promise`\&lt;[`RetrievalGrade`](/api/@graphorin/memory/interfaces/RetrievalGrade.md)\&gt;
