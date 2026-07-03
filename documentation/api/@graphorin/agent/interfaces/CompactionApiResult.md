[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / CompactionApiResult

# Interface: CompactionApiResult

Defined in: packages/agent/src/types.ts:375

Result of `agent.compact({...})`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aftertokens"></a> `afterTokens` | `readonly` | `number` | - | packages/agent/src/types.ts:377 |
| <a id="property-applied"></a> `applied` | `readonly` | `boolean` | `true` when the compaction trimmed + spliced the live run buffer (CE-3/AG-13). `false` results carry an explicit [skippedReason](/api/@graphorin/agent/interfaces/CompactionApiResult.md#property-skippedreason) instead of silently reporting zeros. | packages/agent/src/types.ts:387 |
| <a id="property-beforetokens"></a> `beforeTokens` | `readonly` | `number` | - | packages/agent/src/types.ts:376 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | - | packages/agent/src/types.ts:379 |
| <a id="property-hooksfiredcount"></a> `hooksFiredCount` | `readonly` | `number` | - | packages/agent/src/types.ts:380 |
| <a id="property-skippedreason"></a> `skippedReason?` | `readonly` | `"no-memory"` \| `"no-active-run"` \| `"nothing-to-trim"` \| `"sensitivity-gated"` | Why nothing was spliced, when [applied](/api/@graphorin/agent/interfaces/CompactionApiResult.md#property-applied) is `false`. | packages/agent/src/types.ts:389 |
| <a id="property-summary"></a> `summary` | `readonly` | `string` | - | packages/agent/src/types.ts:381 |
| <a id="property-summarytokens"></a> `summaryTokens` | `readonly` | `number` | - | packages/agent/src/types.ts:378 |
