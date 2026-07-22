[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ExecuteCompactionInput

# Interface: ExecuteCompactionInput

Defined in: packages/memory/src/context-engine/compaction/compactor.ts:117

**`Stable`**

Trim the in-flight buffer using the
`summarize-old-preserve-recent` strategy. Returns the trimmed
messages + summary metadata; the caller is responsible for
appending the summary to the message buffer (Phase 12 owns the
lifecycle; this module exposes the primitive).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/memory/src/context-engine/compaction/compactor.ts:127 |
| <a id="property-localepack"></a> `localePack` | `readonly` | [`ContextLocalePack`](/api/@graphorin/memory/interfaces/ContextLocalePack.md) | packages/memory/src/context-engine/compaction/compactor.ts:121 |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | packages/memory/src/context-engine/compaction/compactor.ts:118 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | packages/memory/src/context-engine/compaction/compactor.ts:130 |
| <a id="property-providertrust"></a> `providerTrust?` | `readonly` | [`LocalProviderTrust`](/api/@graphorin/core/type-aliases/LocalProviderTrust.md) | packages/memory/src/context-engine/compaction/compactor.ts:129 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/memory/src/context-engine/compaction/compactor.ts:125 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | packages/memory/src/context-engine/compaction/compactor.ts:128 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/memory/src/context-engine/compaction/compactor.ts:126 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | packages/memory/src/context-engine/compaction/compactor.ts:131 |
| <a id="property-source"></a> `source` | `readonly` | [`CompactionSource`](/api/@graphorin/memory/type-aliases/CompactionSource.md) | packages/memory/src/context-engine/compaction/compactor.ts:119 |
| <a id="property-strategy"></a> `strategy` | `readonly` | [`CompactionStrategy`](/api/@graphorin/memory/type-aliases/CompactionStrategy.md) | packages/memory/src/context-engine/compaction/compactor.ts:120 |
| <a id="property-summarizer"></a> `summarizer` | `readonly` | [`CompactionSummarizer`](/api/@graphorin/memory/interfaces/CompactionSummarizer.md) | packages/memory/src/context-engine/compaction/compactor.ts:122 |
| <a id="property-thresholdtokens"></a> `thresholdTokens` | `readonly` | `number` | packages/memory/src/context-engine/compaction/compactor.ts:124 |
| <a id="property-tokencounter"></a> `tokenCounter?` | `readonly` | [`ContextTokenCounter`](/api/@graphorin/memory/interfaces/ContextTokenCounter.md) | packages/memory/src/context-engine/compaction/compactor.ts:123 |
