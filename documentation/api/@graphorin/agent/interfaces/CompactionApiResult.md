[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / CompactionApiResult

# Interface: CompactionApiResult

Defined in: [packages/agent/src/types.ts:775](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L775)

Result of `agent.compact({...})`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-aftertokens"></a> `afterTokens` | `readonly` | `number` | - | [packages/agent/src/types.ts:777](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L777) |
| <a id="property-applied"></a> `applied` | `readonly` | `boolean` | `true` when the compaction trimmed + spliced the live run buffer (CE-3/AG-13). `false` results carry an explicit [skippedReason](/api/@graphorin/agent/interfaces/CompactionApiResult.md#property-skippedreason) instead of silently reporting zeros. | [packages/agent/src/types.ts:787](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L787) |
| <a id="property-beforetokens"></a> `beforeTokens` | `readonly` | `number` | - | [packages/agent/src/types.ts:776](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L776) |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | - | [packages/agent/src/types.ts:779](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L779) |
| <a id="property-hooksfiredcount"></a> `hooksFiredCount` | `readonly` | `number` | - | [packages/agent/src/types.ts:780](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L780) |
| <a id="property-skippedreason"></a> `skippedReason?` | `readonly` | `"no-memory"` \| `"no-active-run"` \| `"nothing-to-trim"` \| `"sensitivity-gated"` | Why nothing was spliced, when [applied](/api/@graphorin/agent/interfaces/CompactionApiResult.md#property-applied) is `false`. | [packages/agent/src/types.ts:789](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L789) |
| <a id="property-summary"></a> `summary` | `readonly` | `string` | - | [packages/agent/src/types.ts:781](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L781) |
| <a id="property-summarytokens"></a> `summaryTokens` | `readonly` | `number` | - | [packages/agent/src/types.ts:778](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L778) |
