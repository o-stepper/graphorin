[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / InjectionClassifierGuardrailOptions

# Interface: InjectionClassifierGuardrailOptions

Defined in: packages/security/src/inspect/injection-classifier.ts:77

**`Stable`**

Options for [injectionClassifierOutputGuardrail](/api/@graphorin/security/functions/injectionClassifierOutputGuardrail.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action?` | `readonly` | `"block"` \| `"warn"` | What a flagged output does to the run: `'warn'` (default) logs and continues, `'block'` fails the run. | packages/security/src/inspect/injection-classifier.ts:82 |
