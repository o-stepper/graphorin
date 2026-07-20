[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CompactionConfig

# Interface: CompactionConfig

Defined in: packages/memory/src/context-engine/compaction/types.ts:280

**`Stable`**

Full compaction config. Either `false` (explicitly disabled),
`'auto'` (resolved per-provider at warm-up) or a fully-specified
record.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-postcompactionhooks"></a> `postCompactionHooks?` | `readonly` | readonly [`PostCompactionHook`](/api/@graphorin/memory/type-aliases/PostCompactionHook.md)[] | - | packages/memory/src/context-engine/compaction/types.ts:283 |
| <a id="property-precompactionhooks"></a> `preCompactionHooks?` | `readonly` | readonly ( \| [`NamedPreCompactionHook`](/api/@graphorin/memory/interfaces/NamedPreCompactionHook.md) \| [`PreCompactionHook`](/api/@graphorin/memory/type-aliases/PreCompactionHook.md))[] | Pre-compaction hooks: fired before the summarizer, with the full buffer in context. Default: none - the built-in `memoryFlushHook` is opt-in. Accepts plain functions or named hooks. | packages/memory/src/context-engine/compaction/types.ts:290 |
| <a id="property-strategy"></a> `strategy?` | `readonly` | [`CompactionStrategy`](/api/@graphorin/memory/type-aliases/CompactionStrategy.md) | - | packages/memory/src/context-engine/compaction/types.ts:282 |
| <a id="property-trigger"></a> `trigger?` | `readonly` | \| [`CompactionTriggerConfig`](/api/@graphorin/memory/interfaces/CompactionTriggerConfig.md) \| `"never"` | - | packages/memory/src/context-engine/compaction/types.ts:281 |
