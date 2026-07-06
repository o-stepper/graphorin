[**Graphorin API reference v0.6.1**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/vercel](/api/@graphorin/provider/adapters/vercel/index.md) / LanguageModelLike

# Interface: LanguageModelLike

Defined in: packages/provider/src/adapters/vercel.ts:60

Structural shape the adapter expects from the AI SDK language model
value. The real `LanguageModelV4` matches this shape. Re-declared
here so we do not pin a hard dependency on `@ai-sdk/provider`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-modelid"></a> `modelId` | `readonly` | `string` | - | packages/provider/src/adapters/vercel.ts:62 |
| <a id="property-provider"></a> `provider` | `readonly` | `string` | - | packages/provider/src/adapters/vercel.ts:61 |
| <a id="property-specificationversion"></a> `specificationVersion?` | `readonly` | `string` \| `number` | - | packages/provider/src/adapters/vercel.ts:63 |
| <a id="property-supportedtoolcalltypes"></a> `supportedToolCallTypes?` | `readonly` | readonly `string`[] | Optional capability flags carried by the AI SDK model. The adapter forwards them onto the canonical `ProviderCapabilities` shape; missing values are filled in with conservative defaults. | packages/provider/src/adapters/vercel.ts:69 |
