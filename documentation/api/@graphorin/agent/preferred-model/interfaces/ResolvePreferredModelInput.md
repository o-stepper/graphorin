[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [preferred-model](/api/@graphorin/agent/preferred-model/index.md) / ResolvePreferredModelInput

# Interface: ResolvePreferredModelInput

Defined in: [packages/agent/src/preferred-model/index.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/preferred-model/index.ts#L51)

Pure inputs to [resolvePreferredModel](/api/@graphorin/agent/preferred-model/functions/resolvePreferredModel.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentdefaultprovider"></a> `agentDefaultProvider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | [packages/agent/src/preferred-model/index.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/preferred-model/index.ts#L55) |
| <a id="property-agentpreferredmodel"></a> `agentPreferredModel?` | `readonly` | \| [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md) \| [`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md) | [packages/agent/src/preferred-model/index.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/preferred-model/index.ts#L54) |
| <a id="property-modeltiermap"></a> `modelTierMap?` | `readonly` | `Partial`\<`Record`\&lt;[`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md), [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md)\&gt;\> | [packages/agent/src/preferred-model/index.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/preferred-model/index.ts#L56) |
| <a id="property-preparestepprovider"></a> `prepareStepProvider?` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | [packages/agent/src/preferred-model/index.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/preferred-model/index.ts#L52) |
| <a id="property-toolpreferredmodels"></a> `toolPreferredModels` | `readonly` | readonly ( \| [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md) \| [`ModelHint`](/api/@graphorin/core/type-aliases/ModelHint.md) \| `undefined`)[] | [packages/agent/src/preferred-model/index.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/preferred-model/index.ts#L53) |
