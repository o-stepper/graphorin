[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / MemoryFlushHookOptions

# Interface: MemoryFlushHookOptions

Defined in: [packages/memory/src/context-engine/compaction/hooks/memory-flush.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/hooks/memory-flush.ts#L38)

Options for [memoryFlushHook](/api/@graphorin/memory/functions/memoryFlushHook.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-maxfacts"></a> `maxFacts?` | `readonly` | `number` | Upper bound on facts written per flush. Default `10`. | [packages/memory/src/context-engine/compaction/hooks/memory-flush.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/hooks/memory-flush.ts#L42) |
| <a id="property-maxinputchars"></a> `maxInputChars?` | `readonly` | `number` | Char bound on the transcript slice sent to the provider. Default `24000`. | [packages/memory/src/context-engine/compaction/hooks/memory-flush.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/hooks/memory-flush.ts#L44) |
| <a id="property-maxoutputtokens"></a> `maxOutputTokens?` | `readonly` | `number` | Output-token cap for the flush call. Default `512`. | [packages/memory/src/context-engine/compaction/hooks/memory-flush.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/hooks/memory-flush.ts#L46) |
| <a id="property-provider"></a> `provider` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | The (cheap) provider the one flush call runs on. | [packages/memory/src/context-engine/compaction/hooks/memory-flush.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/hooks/memory-flush.ts#L40) |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | WARN sink override - used by tests. Default `process.stderr`. | [packages/memory/src/context-engine/compaction/hooks/memory-flush.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/hooks/memory-flush.ts#L48) |
