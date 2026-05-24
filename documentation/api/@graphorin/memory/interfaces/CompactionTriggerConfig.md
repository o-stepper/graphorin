[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CompactionTriggerConfig

# Interface: CompactionTriggerConfig

Defined in: packages/memory/src/context-engine/compaction/types.ts:65

Built-in trigger configuration. The auto-trigger fires when the
counted message-buffer tokens cross the threshold; manual and
pre-step trigger sources bypass evaluation entirely.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-thresholdratio"></a> `thresholdRatio?` | `readonly` | `number` | packages/memory/src/context-engine/compaction/types.ts:67 |
| <a id="property-thresholdtokens"></a> `thresholdTokens?` | `readonly` | `number` | packages/memory/src/context-engine/compaction/types.ts:66 |
