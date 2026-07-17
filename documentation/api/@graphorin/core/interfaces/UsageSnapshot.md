[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / UsageSnapshot

# Interface: UsageSnapshot

Defined in: [packages/core/src/types/usage.ts:108](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/usage.ts#L108)

Immutable, JSON-serializable snapshot of a `UsageAccumulator`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-bymodel"></a> `byModel` | `readonly` | readonly [`ModelUsage`](/api/@graphorin/core/interfaces/ModelUsage.md)[] | [packages/core/src/types/usage.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/usage.ts#L110) |
| <a id="property-total"></a> `total` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | [packages/core/src/types/usage.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/usage.ts#L109) |
