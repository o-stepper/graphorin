[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / CompactionApiResult

# Interface: CompactionApiResult

Defined in: [packages/agent/src/types.ts:597](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L597)

Result of `agent.compact({...})`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aftertokens"></a> `afterTokens` | `readonly` | `number` | - | [packages/agent/src/types.ts:599](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L599) |
| <a id="property-applied"></a> `applied` | `readonly` | `boolean` | `true` when the compaction trimmed + spliced the live run buffer (CE-3/AG-13). `false` results carry an explicit [skippedReason](/api/@graphorin/agent/interfaces/CompactionApiResult.md#property-skippedreason) instead of silently reporting zeros. | [packages/agent/src/types.ts:609](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L609) |
| <a id="property-beforetokens"></a> `beforeTokens` | `readonly` | `number` | - | [packages/agent/src/types.ts:598](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L598) |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | - | [packages/agent/src/types.ts:601](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L601) |
| <a id="property-hooksfiredcount"></a> `hooksFiredCount` | `readonly` | `number` | - | [packages/agent/src/types.ts:602](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L602) |
| <a id="property-skippedreason"></a> `skippedReason?` | `readonly` | `"no-memory"` \| `"no-active-run"` \| `"nothing-to-trim"` \| `"sensitivity-gated"` | Why nothing was spliced, when [applied](/api/@graphorin/agent/interfaces/CompactionApiResult.md#property-applied) is `false`. | [packages/agent/src/types.ts:611](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L611) |
| <a id="property-summary"></a> `summary` | `readonly` | `string` | - | [packages/agent/src/types.ts:603](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L603) |
| <a id="property-summarytokens"></a> `summaryTokens` | `readonly` | `number` | - | [packages/agent/src/types.ts:600](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L600) |
