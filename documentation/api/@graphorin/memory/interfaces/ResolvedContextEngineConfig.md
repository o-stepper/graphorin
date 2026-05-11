[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ResolvedContextEngineConfig

# Interface: ResolvedContextEngineConfig

Defined in: packages/memory/src/context-engine/engine.ts:292

Resolved configuration snapshot returned by
[ContextEngine.config](/api/@graphorin/memory/interfaces/ContextEngine.md#config).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-clouduploadconsent"></a> `cloudUploadConsent` | `readonly` | `boolean` | packages/memory/src/context-engine/engine.ts:304 |
| <a id="property-compactionenabled"></a> `compactionEnabled` | `readonly` | `boolean` | packages/memory/src/context-engine/engine.ts:300 |
| <a id="property-compactionthresholdtokens"></a> `compactionThresholdTokens` | `readonly` | `number` | packages/memory/src/context-engine/engine.ts:301 |
| <a id="property-defaultsensitivity"></a> `defaultSensitivity` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | packages/memory/src/context-engine/engine.ts:305 |
| <a id="property-localeid"></a> `localeId` | `readonly` | `string` | packages/memory/src/context-engine/engine.ts:294 |
| <a id="property-maxcontexttokens"></a> `maxContextTokens` | `readonly` | `number` | packages/memory/src/context-engine/engine.ts:295 |
| <a id="property-maxtoolsincontext"></a> `maxToolsInContext` | `readonly` | `number` | packages/memory/src/context-engine/engine.ts:298 |
| <a id="property-memorybasemode"></a> `memoryBaseMode` | `readonly` | [`MemoryBaseMode`](/api/@graphorin/memory/type-aliases/MemoryBaseMode.md) | packages/memory/src/context-engine/engine.ts:293 |
| <a id="property-providercontextwindow"></a> `providerContextWindow` | `readonly` | `number` \| `null` | packages/memory/src/context-engine/engine.ts:302 |
| <a id="property-providertrust"></a> `providerTrust` | `readonly` | [`LocalProviderTrust`](/api/@graphorin/core/type-aliases/LocalProviderTrust.md) | packages/memory/src/context-engine/engine.ts:303 |
| <a id="property-reservedforcompaction"></a> `reservedForCompaction` | `readonly` | `number` | packages/memory/src/context-engine/engine.ts:297 |
| <a id="property-reservedforresponse"></a> `reservedForResponse` | `readonly` | `number` | packages/memory/src/context-engine/engine.ts:296 |
| <a id="property-toolsearchthreshold"></a> `toolSearchThreshold` | `readonly` | `number` | packages/memory/src/context-engine/engine.ts:299 |
