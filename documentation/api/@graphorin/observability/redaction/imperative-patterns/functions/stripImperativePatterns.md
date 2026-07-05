[**Graphorin API reference v0.6.1**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [redaction/imperative-patterns](/api/@graphorin/observability/redaction/imperative-patterns/index.md) / stripImperativePatterns

# Function: stripImperativePatterns()

```ts
function stripImperativePatterns(body, patterns?): string;
```

Defined in: packages/observability/src/redaction/imperative-patterns.ts:259

Apply `pattern.mask` to every match of every pattern in `body`. Used
by the `'detect-and-strip*'` policies. The mask is calibrated to NOT
match any imperative pattern itself, so post-strip bodies do not
trigger another scan hit on round trips.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `body` | `string` | `undefined` |
| `patterns` | readonly [`ImperativePattern`](/api/@graphorin/observability/redaction/imperative-patterns/interfaces/ImperativePattern.md)[] | `BUILT_IN_IMPERATIVE_PATTERNS` |

## Returns

`string`

## Stable
