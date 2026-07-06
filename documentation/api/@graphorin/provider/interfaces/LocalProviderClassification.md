[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / LocalProviderClassification

# Interface: LocalProviderClassification

Defined in: [packages/provider/src/trust/classify-local-provider.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/trust/classify-local-provider.ts#L31)

Result of [classifyLocalProvider](/api/@graphorin/provider/functions/classifyLocalProvider.md). Carries both the trust
class and a short human-readable reason for the WARN log produced
by the consuming adapter.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acceptssensitivity"></a> `acceptsSensitivity` | `readonly` | readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[] | Default `acceptsSensitivity` for this trust class. | [packages/provider/src/trust/classify-local-provider.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/trust/classify-local-provider.ts#L36) |
| <a id="property-reason"></a> `reason` | `readonly` | `string` | One-line reason - `'loopback IP 127.0.0.1'`, `'public IP 5.6.7.8 over HTTPS'`, ... | [packages/provider/src/trust/classify-local-provider.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/trust/classify-local-provider.ts#L34) |
| <a id="property-trust"></a> `trust` | `readonly` | [`LocalProviderTrust`](/api/@graphorin/provider/type-aliases/LocalProviderTrust.md) | - | [packages/provider/src/trust/classify-local-provider.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/trust/classify-local-provider.ts#L32) |
