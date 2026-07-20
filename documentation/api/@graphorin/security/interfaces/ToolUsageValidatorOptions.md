[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ToolUsageValidatorOptions

# Interface: ToolUsageValidatorOptions

Defined in: packages/security/src/guardrails/builtins/tool-usage-validator.ts:35

**`Stable`**

Options for `toolUsageValidator(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action?` | `readonly` | `"block"` \| `"warn"` | Action on rejection. Defaults to `'block'`. | packages/security/src/guardrails/builtins/tool-usage-validator.ts:52 |
| <a id="property-forbiddentools"></a> `forbiddenTools?` | `readonly` | readonly `string`[] | Tool names that must NOT appear. | packages/security/src/guardrails/builtins/tool-usage-validator.ts:39 |
| <a id="property-maxcalls"></a> `maxCalls?` | `readonly` | `number` | Maximum number of total tool invocations. | packages/security/src/guardrails/builtins/tool-usage-validator.ts:41 |
| <a id="property-maxpertool"></a> `maxPerTool?` | `readonly` | `number` | Maximum number of invocations per tool name. | packages/security/src/guardrails/builtins/tool-usage-validator.ts:43 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Override guardrail name. | packages/security/src/guardrails/builtins/tool-usage-validator.ts:54 |
| <a id="property-predicate"></a> `predicate?` | `readonly` | (`calls`) => \| \{ `ok`: `true`; \} \| \{ `message`: `string`; `ok`: `false`; \} | Custom predicate. Returning `false` rejects the run with the supplied `message`. | packages/security/src/guardrails/builtins/tool-usage-validator.ts:48 |
| <a id="property-requiredtools"></a> `requiredTools?` | `readonly` | readonly `string`[] | Tool names that must appear at least once. | packages/security/src/guardrails/builtins/tool-usage-validator.ts:37 |
