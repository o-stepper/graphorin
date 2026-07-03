[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ExecuteCompactionInput

# Interface: ExecuteCompactionInput

Defined in: packages/memory/src/context-engine/compaction/compactor.ts:92

Trim the in-flight buffer using the
`summarize-old-preserve-recent` strategy. Returns the trimmed
messages + summary metadata; the caller is responsible for
appending the summary to the message buffer (Phase 12 owns the
lifecycle; this module exposes the primitive).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/memory/src/context-engine/compaction/compactor.ts:102 |
| <a id="property-localepack"></a> `localePack` | `readonly` | [`ContextLocalePack`](/api/@graphorin/memory/interfaces/ContextLocalePack.md) | packages/memory/src/context-engine/compaction/compactor.ts:96 |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | packages/memory/src/context-engine/compaction/compactor.ts:93 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | packages/memory/src/context-engine/compaction/compactor.ts:105 |
| <a id="property-providertrust"></a> `providerTrust?` | `readonly` | [`LocalProviderTrust`](/api/@graphorin/core/type-aliases/LocalProviderTrust.md) | packages/memory/src/context-engine/compaction/compactor.ts:104 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/memory/src/context-engine/compaction/compactor.ts:100 |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | packages/memory/src/context-engine/compaction/compactor.ts:103 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/memory/src/context-engine/compaction/compactor.ts:101 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | packages/memory/src/context-engine/compaction/compactor.ts:106 |
| <a id="property-source"></a> `source` | `readonly` | [`CompactionSource`](/api/@graphorin/memory/type-aliases/CompactionSource.md) | packages/memory/src/context-engine/compaction/compactor.ts:94 |
| <a id="property-strategy"></a> `strategy` | `readonly` | [`CompactionStrategy`](/api/@graphorin/memory/type-aliases/CompactionStrategy.md) | packages/memory/src/context-engine/compaction/compactor.ts:95 |
| <a id="property-summarizer"></a> `summarizer` | `readonly` | [`CompactionSummarizer`](/api/@graphorin/memory/interfaces/CompactionSummarizer.md) | packages/memory/src/context-engine/compaction/compactor.ts:97 |
| <a id="property-thresholdtokens"></a> `thresholdTokens` | `readonly` | `number` | packages/memory/src/context-engine/compaction/compactor.ts:99 |
| <a id="property-tokencounter"></a> `tokenCounter?` | `readonly` | [`ContextTokenCounter`](/api/@graphorin/memory/interfaces/ContextTokenCounter.md) | packages/memory/src/context-engine/compaction/compactor.ts:98 |
