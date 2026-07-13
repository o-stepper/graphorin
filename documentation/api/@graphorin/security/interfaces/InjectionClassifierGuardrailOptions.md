[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / InjectionClassifierGuardrailOptions

# Interface: InjectionClassifierGuardrailOptions

Defined in: [packages/security/src/inspect/injection-classifier.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/inspect/injection-classifier.ts#L77)

Options for [injectionClassifierOutputGuardrail](/api/@graphorin/security/functions/injectionClassifierOutputGuardrail.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action?` | `readonly` | `"block"` \| `"warn"` | What a flagged output does to the run: `'warn'` (default) logs and continues, `'block'` fails the run. | [packages/security/src/inspect/injection-classifier.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/inspect/injection-classifier.ts#L82) |
