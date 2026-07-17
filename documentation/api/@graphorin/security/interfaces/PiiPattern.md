[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / PiiPattern

# Interface: PiiPattern

Defined in: [packages/security/src/guardrails/builtins/pii-detection.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/pii-detection.ts#L33)

One pattern in the catalogue. The `kind` discriminator surfaces in
audit metadata so SIEM dashboards can filter by sensitive type.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `string` | - | [packages/security/src/guardrails/builtins/pii-detection.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/pii-detection.ts#L34) |
| <a id="property-pattern"></a> `pattern` | `readonly` | `RegExp` | - | [packages/security/src/guardrails/builtins/pii-detection.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/pii-detection.ts#L35) |
| <a id="property-validate"></a> `validate?` | `readonly` | (`match`) => `boolean` | Optional post-match validator (e.g. Luhn check for credit cards). | [packages/security/src/guardrails/builtins/pii-detection.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builtins/pii-detection.ts#L37) |
