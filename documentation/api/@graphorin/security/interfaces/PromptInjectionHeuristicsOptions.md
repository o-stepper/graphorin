[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / PromptInjectionHeuristicsOptions

# Interface: PromptInjectionHeuristicsOptions

Defined in: packages/security/src/guardrails/builtins/prompt-injection-heuristics.ts:49

**`Stable`**

Options for `promptInjectionHeuristics(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action?` | `readonly` | `"block"` \| `"warn"` | Action to take on a match. Defaults to `'block'`. | packages/security/src/guardrails/builtins/prompt-injection-heuristics.ts:55 |
| <a id="property-extrapatterns"></a> `extraPatterns?` | `readonly` | readonly `RegExp`[] | Additional patterns merged with the default catalogue. | packages/security/src/guardrails/builtins/prompt-injection-heuristics.ts:51 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Override guardrail name (helpful when multiple are registered). | packages/security/src/guardrails/builtins/prompt-injection-heuristics.ts:57 |
| <a id="property-patterns"></a> `patterns?` | `readonly` | readonly `RegExp`[] | Replace the default catalogue entirely. | packages/security/src/guardrails/builtins/prompt-injection-heuristics.ts:53 |
