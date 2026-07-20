[**Graphorin API reference v0.13.6**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [redaction/imperative-patterns](/api/@graphorin/observability/redaction/imperative-patterns/index.md) / ImperativePatternName

# Type Alias: ImperativePatternName

```ts
type ImperativePatternName = 
  | "ignore-previous-instructions"
  | "forget-instructions"
  | "override-instructions"
  | "system-prompt-leak"
  | "role-reassignment"
  | "developer-mode"
  | "jailbreak-marker"
  | "tool-call-injection"
  | "role-tag-injection"
  | "untrusted-content-delimiter-injection";
```

Defined in: packages/observability/src/redaction/imperative-patterns.ts:30

**`Stable`**

Stable name of an imperative pattern. The catalogue is curated;
user-supplied patterns can use any identifier they want and will be
passed through the sanitization layer alongside the built-ins.
