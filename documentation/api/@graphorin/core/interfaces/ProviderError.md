[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProviderError

# Interface: ProviderError

Defined in: [packages/core/src/contracts/provider.ts:229](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L229)

Provider-side error shape carried by `provider-error` events.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-cause"></a> `cause?` | `readonly` | `unknown` | [packages/core/src/contracts/provider.ts:232](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L232) |
| <a id="property-kind"></a> `kind` | `readonly` | [`ProviderErrorKind`](/api/@graphorin/core/type-aliases/ProviderErrorKind.md) | [packages/core/src/contracts/provider.ts:230](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L230) |
| <a id="property-message"></a> `message` | `readonly` | `string` | [packages/core/src/contracts/provider.ts:231](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/provider.ts#L231) |
