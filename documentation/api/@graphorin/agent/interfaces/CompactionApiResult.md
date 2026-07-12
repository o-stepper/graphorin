[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / CompactionApiResult

# Interface: CompactionApiResult

Defined in: [packages/agent/src/types.ts:630](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L630)

Result of `agent.compact({...})`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aftertokens"></a> `afterTokens` | `readonly` | `number` | - | [packages/agent/src/types.ts:632](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L632) |
| <a id="property-applied"></a> `applied` | `readonly` | `boolean` | `true` when the compaction trimmed + spliced the live run buffer (CE-3/AG-13). `false` results carry an explicit [skippedReason](/api/@graphorin/agent/interfaces/CompactionApiResult.md#property-skippedreason) instead of silently reporting zeros. | [packages/agent/src/types.ts:642](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L642) |
| <a id="property-beforetokens"></a> `beforeTokens` | `readonly` | `number` | - | [packages/agent/src/types.ts:631](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L631) |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | - | [packages/agent/src/types.ts:634](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L634) |
| <a id="property-hooksfiredcount"></a> `hooksFiredCount` | `readonly` | `number` | - | [packages/agent/src/types.ts:635](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L635) |
| <a id="property-skippedreason"></a> `skippedReason?` | `readonly` | `"no-memory"` \| `"no-active-run"` \| `"nothing-to-trim"` \| `"sensitivity-gated"` | Why nothing was spliced, when [applied](/api/@graphorin/agent/interfaces/CompactionApiResult.md#property-applied) is `false`. | [packages/agent/src/types.ts:644](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L644) |
| <a id="property-summary"></a> `summary` | `readonly` | `string` | - | [packages/agent/src/types.ts:636](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L636) |
| <a id="property-summarytokens"></a> `summaryTokens` | `readonly` | `number` | - | [packages/agent/src/types.ts:633](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L633) |
