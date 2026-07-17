[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / GuardrailAction

# Type Alias: GuardrailAction

```ts
type GuardrailAction = "block" | "warn" | "rewrite";
```

Defined in: [packages/security/src/guardrails/types.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/types.ts#L33)

Action requested by a failing guardrail.

- `'block'` - the runtime refuses to proceed and surfaces the
  failure as a structured error.
- `'warn'` - the runtime continues but records a WARN-level event;
  suitable for telemetry-only rules.
- `'rewrite'` - the runtime substitutes the supplied `rewrite`
  value before continuing (e.g. PII redaction with a masked output).

## Stable
