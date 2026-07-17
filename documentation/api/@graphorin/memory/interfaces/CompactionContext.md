[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CompactionContext

# Interface: CompactionContext

Defined in: [packages/memory/src/context-engine/compaction/types.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L25)

Per-call context handed to a custom strategy + post-compaction
hooks. Threaded through Phase 12's lifecycle.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/memory/src/context-engine/compaction/types.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L28) |
| <a id="property-beforetokens"></a> `beforeTokens` | `readonly` | `number` | [packages/memory/src/context-engine/compaction/types.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L32) |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | [packages/memory/src/context-engine/compaction/types.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L31) |
| <a id="property-preserverecentturns"></a> `preserveRecentTurns` | `readonly` | `number` | [packages/memory/src/context-engine/compaction/types.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L34) |
| <a id="property-providertrust"></a> `providerTrust` | `readonly` | [`LocalProviderTrust`](/api/@graphorin/core/type-aliases/LocalProviderTrust.md) | [packages/memory/src/context-engine/compaction/types.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L35) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/memory/src/context-engine/compaction/types.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L26) |
| <a id="property-scope"></a> `scope` | `readonly` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) | [packages/memory/src/context-engine/compaction/types.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L29) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | [packages/memory/src/context-engine/compaction/types.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L27) |
| <a id="property-source"></a> `source` | `readonly` | [`CompactionSource`](/api/@graphorin/memory/type-aliases/CompactionSource.md) | [packages/memory/src/context-engine/compaction/types.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L30) |
| <a id="property-summarizermodel"></a> `summarizerModel?` | `readonly` | `string` \| [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md) | [packages/memory/src/context-engine/compaction/types.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L36) |
| <a id="property-thresholdtokens"></a> `thresholdTokens` | `readonly` | `number` | [packages/memory/src/context-engine/compaction/types.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/types.ts#L33) |
