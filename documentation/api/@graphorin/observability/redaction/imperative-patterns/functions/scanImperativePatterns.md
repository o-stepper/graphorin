[**Graphorin API reference v0.10.1**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [redaction/imperative-patterns](/api/@graphorin/observability/redaction/imperative-patterns/index.md) / scanImperativePatterns

# Function: scanImperativePatterns()

```ts
function scanImperativePatterns(
   body, 
   patterns?, 
   budgetMs?): 
  | ScanResult
  | null;
```

Defined in: [packages/observability/src/redaction/imperative-patterns.ts:199](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/imperative-patterns.ts#L199)

Run the imperative-pattern scan against `body`. Patterns are
iterated in catalogue order; the prefilter shortcut returns early
for bodies that do not contain any imperative-family substring.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `body` | `string` | `undefined` |
| `patterns` | readonly [`ImperativePattern`](/api/@graphorin/observability/redaction/imperative-patterns/interfaces/ImperativePattern.md)[] | `BUILT_IN_IMPERATIVE_PATTERNS` |
| `budgetMs` | `number` | `5` |

## Returns

  \| [`ScanResult`](/api/@graphorin/observability/redaction/imperative-patterns/interfaces/ScanResult.md)
  \| `null`

## Stable
