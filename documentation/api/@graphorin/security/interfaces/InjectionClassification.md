[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / InjectionClassification

# Interface: InjectionClassification

Defined in: [packages/security/src/inspect/injection-classifier.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/inspect/injection-classifier.ts#L37)

One classification verdict.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-flagged"></a> `flagged` | `readonly` | `boolean` | - | [packages/security/src/inspect/injection-classifier.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/inspect/injection-classifier.ts#L38) |
| <a id="property-labels"></a> `labels?` | `readonly` | readonly `string`[] | Bounded descriptive labels (audit counters). | [packages/security/src/inspect/injection-classifier.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/inspect/injection-classifier.ts#L42) |
| <a id="property-score"></a> `score?` | `readonly` | `number` | Confidence in [0, 1], when the engine reports one. | [packages/security/src/inspect/injection-classifier.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/inspect/injection-classifier.ts#L40) |
