[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / TriggerOptions

# Interface: TriggerOptions

Defined in: packages/triggers/src/index.ts:34

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acknowledgelibmode"></a> `acknowledgeLibMode?` | `readonly` | `boolean` | Suppress the one-time per-process library-mode WARN. Library callers acknowledging that triggers fire only as long as the process lives pass `true` here. | packages/triggers/src/index.ts:51 |
| <a id="property-catchuppolicy"></a> `catchupPolicy?` | `readonly` | [`CatchupPolicy`](/api/@graphorin/triggers/type-aliases/CatchupPolicy.md) | - | packages/triggers/src/index.ts:35 |
| <a id="property-catchupwindowms"></a> `catchupWindowMs?` | `readonly` | `number` | How far back (from the last successful fire) misses are honored. Catch-up counts REAL missed fires (RP-12), so the window must exceed the trigger period - a 24h window can never catch up a daily cron whose boundary is itself 24h after the last fire. Default 24h. | packages/triggers/src/index.ts:44 |
| <a id="property-maxcatchupruns"></a> `maxCatchupRuns?` | `readonly` | `number` | - | packages/triggers/src/index.ts:36 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | packages/triggers/src/index.ts:45 |
