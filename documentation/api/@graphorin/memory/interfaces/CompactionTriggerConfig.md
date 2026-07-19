[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CompactionTriggerConfig

# Interface: CompactionTriggerConfig

Defined in: packages/memory/src/context-engine/compaction/types.ts:76

**`Stable`**

Built-in trigger configuration. The auto-trigger fires when the
counted message-buffer tokens cross the threshold; manual and
pre-step trigger sources bypass evaluation entirely.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-minreclaimtokens"></a> `minReclaimTokens?` | `readonly` | `number` | SOTA-4 reclaim-floor: defer a compaction whose predicted reclaim - the older, compactable portion of the buffer (everything but the preserved recent turns) - is below this many tokens. Prevents compact-thrash at the threshold (paying a summarizer call to reclaim a handful of tokens). Opt-in; unset / `0` ⇒ no floor (current behaviour). | packages/memory/src/context-engine/compaction/types.ts:86 |
| <a id="property-thresholdratio"></a> `thresholdRatio?` | `readonly` | `number` | - | packages/memory/src/context-engine/compaction/types.ts:78 |
| <a id="property-thresholdtokens"></a> `thresholdTokens?` | `readonly` | `number` | - | packages/memory/src/context-engine/compaction/types.ts:77 |
