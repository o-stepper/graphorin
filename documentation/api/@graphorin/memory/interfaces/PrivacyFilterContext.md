[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PrivacyFilterContext

# Interface: PrivacyFilterContext

Defined in: packages/memory/src/context-engine/privacy-filter.ts:22

**`Stable`**

Filter input: the record-level sensitivity tag + the per-tier
trust class of the active provider.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-clouduploadconsent"></a> `cloudUploadConsent?` | `readonly` | `boolean` | Per-user opt-in for cloud upload of `'internal'`-tier content. Default `false` - `'internal'` content does not leave the loopback boundary unless the user explicitly opts in. | packages/memory/src/context-engine/privacy-filter.ts:39 |
| <a id="property-defaultsensitivity"></a> `defaultSensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Override the default sensitivity applied to records that are missing a tag. Default `'internal'` per DEC-126. | packages/memory/src/context-engine/privacy-filter.ts:44 |
| <a id="property-provideracceptssensitivity"></a> `providerAcceptsSensitivity?` | `readonly` | readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[] | Sensitivity tiers the active provider is allowed to receive. When omitted, the per-tier defaults below apply. | packages/memory/src/context-engine/privacy-filter.ts:27 |
| <a id="property-providertrust"></a> `providerTrust?` | `readonly` | [`LocalProviderTrust`](/api/@graphorin/core/type-aliases/LocalProviderTrust.md) | Trust class of the active provider as classified by `@graphorin/provider/trust/classify-local-provider.ts`. Defaults to `'public-tls'` (the conservative cloud default). | packages/memory/src/context-engine/privacy-filter.ts:33 |
