[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DEFAULT\_INJECTION\_PATTERNS

# Variable: DEFAULT\_INJECTION\_PATTERNS

```ts
const DEFAULT_INJECTION_PATTERNS: ReadonlyArray<RegExp>;
```

Defined in: packages/security/src/guardrails/builtins/prompt-injection-heuristics.ts:33

Default catalogue of injection patterns. The patterns are
case-insensitive and match common phrasings of the canonical
inbound-prompt-injection family. Operators can extend the
catalogue via `extraPatterns`.

## Stable
