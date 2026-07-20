[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ResolvedContextEngineConfig

# Interface: ResolvedContextEngineConfig

Defined in: packages/memory/src/context-engine/io-types.ts:102

**`Stable`**

Resolved configuration snapshot returned by
[ContextEngine.config](/api/@graphorin/memory/interfaces/ContextEngine.md#config).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-clouduploadconsent"></a> `cloudUploadConsent` | `readonly` | `boolean` | - | packages/memory/src/context-engine/io-types.ts:119 |
| <a id="property-compactioneffective"></a> `compactionEffective` | `readonly` | `boolean` | Whether compaction can actually fire: `compactionEnabled` **and** a `providerContextWindow` was supplied. `compactionEnabled: true` with `compactionEffective: false` is the honest signal that compaction is configured-on but a no-op for want of a context window. | packages/memory/src/context-engine/io-types.ts:115 |
| <a id="property-compactionenabled"></a> `compactionEnabled` | `readonly` | `boolean` | - | packages/memory/src/context-engine/io-types.ts:108 |
| <a id="property-compactionthresholdtokens"></a> `compactionThresholdTokens` | `readonly` | `number` | - | packages/memory/src/context-engine/io-types.ts:116 |
| <a id="property-defaultsensitivity"></a> `defaultSensitivity` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | packages/memory/src/context-engine/io-types.ts:120 |
| <a id="property-localeid"></a> `localeId` | `readonly` | `string` | - | packages/memory/src/context-engine/io-types.ts:104 |
| <a id="property-maxcontexttokens"></a> `maxContextTokens` | `readonly` | `number` | - | packages/memory/src/context-engine/io-types.ts:105 |
| <a id="property-memorybasemode"></a> `memoryBaseMode` | `readonly` | [`MemoryBaseMode`](/api/@graphorin/memory/type-aliases/MemoryBaseMode.md) | - | packages/memory/src/context-engine/io-types.ts:103 |
| <a id="property-providercontextwindow"></a> `providerContextWindow` | `readonly` | `number` \| `null` | - | packages/memory/src/context-engine/io-types.ts:117 |
| <a id="property-providertrust"></a> `providerTrust` | `readonly` | [`LocalProviderTrust`](/api/@graphorin/core/type-aliases/LocalProviderTrust.md) | - | packages/memory/src/context-engine/io-types.ts:118 |
| <a id="property-reservedforcompaction"></a> `reservedForCompaction` | `readonly` | `number` | - | packages/memory/src/context-engine/io-types.ts:107 |
| <a id="property-reservedforresponse"></a> `reservedForResponse` | `readonly` | `number` | - | packages/memory/src/context-engine/io-types.ts:106 |
