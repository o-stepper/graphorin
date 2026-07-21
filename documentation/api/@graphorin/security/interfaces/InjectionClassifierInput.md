[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / InjectionClassifierInput

# Interface: InjectionClassifierInput

Defined in: packages/security/src/inspect/injection-classifier.ts:29

**`Stable`**

One classification request.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-origin"></a> `origin?` | `readonly` | `string` | Optional provenance label, e.g. `'channel:telegram'`. | packages/security/src/inspect/injection-classifier.ts:33 |
| <a id="property-surface"></a> `surface` | `readonly` | [`InjectionClassifierSurface`](/api/@graphorin/security/type-aliases/InjectionClassifierSurface.md) | - | packages/security/src/inspect/injection-classifier.ts:31 |
| <a id="property-text"></a> `text` | `readonly` | `string` | - | packages/security/src/inspect/injection-classifier.ts:30 |
