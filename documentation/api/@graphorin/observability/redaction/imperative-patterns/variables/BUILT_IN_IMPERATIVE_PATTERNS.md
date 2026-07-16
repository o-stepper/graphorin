[**Graphorin API reference v0.10.1**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [redaction/imperative-patterns](/api/@graphorin/observability/redaction/imperative-patterns/index.md) / BUILT\_IN\_IMPERATIVE\_PATTERNS

# Variable: BUILT\_IN\_IMPERATIVE\_PATTERNS

```ts
const BUILT_IN_IMPERATIVE_PATTERNS: readonly ImperativePattern[] = PATTERNS;
```

Defined in: [packages/observability/src/redaction/imperative-patterns.ts:165](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/imperative-patterns.ts#L165)

The default-on imperative-pattern catalogue. Stable across patches;
additions during the pre-1.0 window are minor-bumps because new
patterns may produce additional `tool.inbound.sanitization.hit{...}`
counter increments on existing deployments.

## Stable
