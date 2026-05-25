[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / PendingPauseRecord

# Interface: PendingPauseRecord

Defined in: packages/workflow/src/types.ts:287

Structured record stored alongside a suspended checkpoint so the
engine can resume the paused node with the operator's directive.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-dispatchargs"></a> `dispatchArgs?` | `readonly` | `unknown` | Args supplied to [Dispatch](/api/@graphorin/workflow/classes/Dispatch.md) when the paused task was scheduled. | packages/workflow/src/types.ts:291 |
| <a id="property-nodename"></a> `nodeName` | `readonly` | `string` | - | packages/workflow/src/types.ts:288 |
| <a id="property-staticafter"></a> `staticAfter?` | `readonly` | `boolean` | When `true` the engine paused after the task completed, via `pauseAt.after`. | packages/workflow/src/types.ts:295 |
| <a id="property-staticbefore"></a> `staticBefore?` | `readonly` | `boolean` | When `true` the task was paused statically by `pauseAt.before`. | packages/workflow/src/types.ts:293 |
| <a id="property-value"></a> `value` | `readonly` | `unknown` | - | packages/workflow/src/types.ts:289 |
