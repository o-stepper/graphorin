[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CompactionConfig

# Interface: CompactionConfig

Defined in: packages/memory/src/context-engine/compaction/types.ts:227

Full compaction config. Either `false` (explicitly disabled),
`'auto'` (resolved per-provider at warm-up) or a fully-specified
record.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-postcompactionhooks"></a> `postCompactionHooks?` | `readonly` | readonly [`PostCompactionHook`](/api/@graphorin/memory/type-aliases/PostCompactionHook.md)[] | packages/memory/src/context-engine/compaction/types.ts:230 |
| <a id="property-strategy"></a> `strategy?` | `readonly` | [`CompactionStrategy`](/api/@graphorin/memory/type-aliases/CompactionStrategy.md) | packages/memory/src/context-engine/compaction/types.ts:229 |
| <a id="property-trigger"></a> `trigger?` | `readonly` | \| [`CompactionTriggerConfig`](/api/@graphorin/memory/interfaces/CompactionTriggerConfig.md) \| `"never"` | packages/memory/src/context-engine/compaction/types.ts:228 |
