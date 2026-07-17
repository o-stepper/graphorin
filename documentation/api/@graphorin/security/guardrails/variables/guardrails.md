[**Graphorin API reference v0.11.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [guardrails](/api/@graphorin/security/guardrails/index.md) / guardrails

# Variable: guardrails

```ts
const guardrails: Readonly<{
  languageWhitelist: <TValue>(opts) => InputGuardrail<TValue>;
  llmModeration: <TValue>(opts) => InputGuardrail<TValue>;
  maxLength: <TValue>(opts) => GuardrailDefinition<TValue>;
  outputModeration: <TValue>(opts) => OutputGuardrail<TValue>;
  piiDetection: <TValue>(opts) => GuardrailDefinition<TValue>;
  promptInjectionHeuristics: <TValue>(opts) => InputGuardrail<TValue>;
  toolUsageValidator: (opts) => OutputGuardrail<unknown>;
}>;
```

Defined in: [packages/security/src/guardrails/index.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/index.ts#L65)

Bundled namespace of built-in guardrail factories. Mirrors the
`guardrails.maxLength({ ... })` style used by the framework's
documented quick-start.

## Stable
