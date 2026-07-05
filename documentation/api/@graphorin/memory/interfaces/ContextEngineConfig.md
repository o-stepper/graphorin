[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ContextEngineConfig

# Interface: ContextEngineConfig

Defined in: packages/memory/src/context-engine/engine.ts:139

Configuration accepted by [createContextEngine](/api/@graphorin/memory/functions/createContextEngine.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-compaction"></a> `compaction?` | `readonly` | \| `false` \| [`CompactionConfig`](/api/@graphorin/memory/interfaces/CompactionConfig.md) | Auto-compaction configuration (RB-46). | packages/memory/src/context-engine/engine.ts:171 |
| <a id="property-factsautorecall"></a> `factsAutoRecall?` | `readonly` | [`AutoRecallConfig`](/api/@graphorin/memory/type-aliases/AutoRecallConfig.md) | Auto-recall trigger configuration. Default `false`. | packages/memory/src/context-engine/engine.ts:159 |
| <a id="property-layers"></a> `layers?` | `readonly` | \{ `activeRules?`: [`LayerConfig`](/api/@graphorin/memory/interfaces/LayerConfig.md); `activeSkills?`: [`LayerConfig`](/api/@graphorin/memory/interfaces/LayerConfig.md); `autoRecall?`: [`LayerConfig`](/api/@graphorin/memory/interfaces/LayerConfig.md) & \{ `threshold?`: `number`; `topK?`: `number`; \}; `identity?`: [`LayerConfig`](/api/@graphorin/memory/interfaces/LayerConfig.md); `memoryMetadata?`: [`LayerConfig`](/api/@graphorin/memory/interfaces/LayerConfig.md); `workingBlocks?`: [`LayerConfig`](/api/@graphorin/memory/interfaces/LayerConfig.md); \} | Per-layer enable / cap overrides. | packages/memory/src/context-engine/engine.ts:150 |
| `layers.activeRules?` | `readonly` | [`LayerConfig`](/api/@graphorin/memory/interfaces/LayerConfig.md) | - | packages/memory/src/context-engine/engine.ts:153 |
| `layers.activeSkills?` | `readonly` | [`LayerConfig`](/api/@graphorin/memory/interfaces/LayerConfig.md) | - | packages/memory/src/context-engine/engine.ts:154 |
| `layers.autoRecall?` | `readonly` | [`LayerConfig`](/api/@graphorin/memory/interfaces/LayerConfig.md) & \{ `threshold?`: `number`; `topK?`: `number`; \} | - | packages/memory/src/context-engine/engine.ts:156 |
| `layers.identity?` | `readonly` | [`LayerConfig`](/api/@graphorin/memory/interfaces/LayerConfig.md) | - | packages/memory/src/context-engine/engine.ts:151 |
| `layers.memoryMetadata?` | `readonly` | [`LayerConfig`](/api/@graphorin/memory/interfaces/LayerConfig.md) | - | packages/memory/src/context-engine/engine.ts:152 |
| `layers.workingBlocks?` | `readonly` | [`LayerConfig`](/api/@graphorin/memory/interfaces/LayerConfig.md) | - | packages/memory/src/context-engine/engine.ts:155 |
| <a id="property-locale"></a> `locale?` | `readonly` | \| `string` \| [`ContextLocalePack`](/api/@graphorin/memory/interfaces/ContextLocalePack.md) \| [`PartialContextLocalePack`](/api/@graphorin/memory/interfaces/PartialContextLocalePack.md) | Default `'en'`. Pluggable via `defineContextLocalePack`. | packages/memory/src/context-engine/engine.ts:148 |
| <a id="property-maxcontexttokens"></a> `maxContextTokens?` | `readonly` | `number` | Hard token budget. Default `Number.POSITIVE_INFINITY` (no global cap). | packages/memory/src/context-engine/engine.ts:163 |
| <a id="property-memorybasemode"></a> `memoryBaseMode?` | `readonly` | [`MemoryBaseMode`](/api/@graphorin/memory/type-aliases/MemoryBaseMode.md) | Layer 1 base-template mode. `'full'` (default) ships the verbose ~250-350 token narrative aimed at general LLMs; `'minimal'` opts top-tier models into the ~80-120 token compact form. | packages/memory/src/context-engine/engine.ts:146 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Wall clock for tests + deterministic compaction. | packages/memory/src/context-engine/engine.ts:177 |
| <a id="property-privacy"></a> `privacy?` | `readonly` | [`PrivacyConfig`](/api/@graphorin/memory/interfaces/PrivacyConfig.md) | Privacy-filter configuration. | packages/memory/src/context-engine/engine.ts:161 |
| <a id="property-providercontextwindow"></a> `providerContextWindow?` | `readonly` | `number` | Active provider's context window; required when compaction is enabled. | packages/memory/src/context-engine/engine.ts:173 |
| <a id="property-reservedforcompaction"></a> `reservedForCompaction?` | `readonly` | `number` | Tokens reserved for the compaction summarizer call. Default `8192`. | packages/memory/src/context-engine/engine.ts:167 |
| <a id="property-reservedforresponse"></a> `reservedForResponse?` | `readonly` | `number` | Tokens reserved for the model's response. Default `4096`. | packages/memory/src/context-engine/engine.ts:165 |
| <a id="property-summarizer"></a> `summarizer?` | `readonly` | [`CompactionSummarizer`](/api/@graphorin/memory/interfaces/CompactionSummarizer.md) | Default summarizer adapter the auto-trigger uses. | packages/memory/src/context-engine/engine.ts:175 |
| <a id="property-tokencounter"></a> `tokenCounter?` | `readonly` | \| [`ContextTokenCounter`](/api/@graphorin/memory/interfaces/ContextTokenCounter.md) \| [`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md) | Pluggable token counter. Default heuristic (chars/4). | packages/memory/src/context-engine/engine.ts:169 |
