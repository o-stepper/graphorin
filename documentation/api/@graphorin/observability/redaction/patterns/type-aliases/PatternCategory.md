[**Graphorin API reference v0.13.10**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [redaction/patterns](/api/@graphorin/observability/redaction/patterns/index.md) / PatternCategory

# Type Alias: PatternCategory

```ts
type PatternCategory = "secret" | "pii";
```

Defined in: packages/observability/src/redaction/patterns.ts:51

**`Stable`**

Pattern category - `secret` matches always force a drop; `pii`
matches respect the configured `enabledPatterns` allow-list.
