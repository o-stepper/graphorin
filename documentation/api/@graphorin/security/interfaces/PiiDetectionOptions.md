[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / PiiDetectionOptions

# Interface: PiiDetectionOptions

Defined in: packages/security/src/guardrails/builtins/pii-detection.ts:87

**`Stable`**

Options for `piiDetection(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action?` | `readonly` | `"block"` \| `"warn"` \| `"rewrite"` | Action to take on a match. Defaults to `'rewrite'` (mask the detected substring with `[REDACTED:<kind>]`). | packages/security/src/guardrails/builtins/pii-detection.ts:96 |
| <a id="property-extrapatterns"></a> `extraPatterns?` | `readonly` | readonly [`PiiPattern`](/api/@graphorin/security/interfaces/PiiPattern.md)[] | Additional patterns merged with the default catalogue. | packages/security/src/guardrails/builtins/pii-detection.ts:89 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Override guardrail name. | packages/security/src/guardrails/builtins/pii-detection.ts:100 |
| <a id="property-patterns"></a> `patterns?` | `readonly` | readonly [`PiiPattern`](/api/@graphorin/security/interfaces/PiiPattern.md)[] | Replace the default catalogue entirely. | packages/security/src/guardrails/builtins/pii-detection.ts:91 |
| <a id="property-stage"></a> `stage?` | `readonly` | `"input"` \| `"output"` | Stage the guardrail applies to. Defaults to `'input'`. | packages/security/src/guardrails/builtins/pii-detection.ts:98 |
