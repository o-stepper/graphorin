[**Graphorin API reference v0.8.0**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [redaction/imperative-patterns](/api/@graphorin/observability/redaction/imperative-patterns/index.md) / IMPERATIVE\_PREFILTER\_SUBSTRINGS

# Variable: IMPERATIVE\_PREFILTER\_SUBSTRINGS

```ts
const IMPERATIVE_PREFILTER_SUBSTRINGS: ReadonlyArray<string>;
```

Defined in: [packages/observability/src/redaction/imperative-patterns.ts:174](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/imperative-patterns.ts#L174)

Combined Aho-Corasick-style prefilter set across every pattern.
Lower-cased substrings; consumers test the body once with the
combined filter before iterating regexes.

## Stable
