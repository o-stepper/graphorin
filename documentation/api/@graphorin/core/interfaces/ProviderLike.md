[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProviderLike

# Interface: ProviderLike

Defined in: [packages/core/src/contracts/preferred-model.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/preferred-model.ts#L40)

**`Internal`**

Forward-declared shape of `Provider`. Re-declared here as a minimal
structural type so this module stays cycle-free with respect to
`./provider.ts` and downstream consumers can use `ModelSpec` without
importing the heavier `Provider` interface.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-modelid"></a> `modelId` | `readonly` | `string` | [packages/core/src/contracts/preferred-model.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/preferred-model.ts#L42) |
| <a id="property-name"></a> `name` | `readonly` | `string` | [packages/core/src/contracts/preferred-model.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/preferred-model.ts#L41) |
