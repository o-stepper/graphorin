[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / CompactionApiResult

# Interface: CompactionApiResult

Defined in: packages/agent/src/types.ts:789

**`Stable`**

Result of `agent.compact({...})`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aftertokens"></a> `afterTokens` | `readonly` | `number` | - | packages/agent/src/types.ts:791 |
| <a id="property-applied"></a> `applied` | `readonly` | `boolean` | `true` when the compaction trimmed + spliced the live run buffer. `false` results carry an explicit [skippedReason](/api/@graphorin/agent/interfaces/CompactionApiResult.md#property-skippedreason) instead of silently reporting zeros. | packages/agent/src/types.ts:801 |
| <a id="property-beforetokens"></a> `beforeTokens` | `readonly` | `number` | - | packages/agent/src/types.ts:790 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | - | packages/agent/src/types.ts:793 |
| <a id="property-hooksfiredcount"></a> `hooksFiredCount` | `readonly` | `number` | - | packages/agent/src/types.ts:794 |
| <a id="property-skippedreason"></a> `skippedReason?` | `readonly` | `"no-memory"` \| `"no-active-run"` \| `"nothing-to-trim"` \| `"sensitivity-gated"` | Why nothing was spliced, when [applied](/api/@graphorin/agent/interfaces/CompactionApiResult.md#property-applied) is `false`. | packages/agent/src/types.ts:803 |
| <a id="property-summary"></a> `summary` | `readonly` | `string` | - | packages/agent/src/types.ts:795 |
| <a id="property-summarytokens"></a> `summaryTokens` | `readonly` | `number` | - | packages/agent/src/types.ts:792 |
