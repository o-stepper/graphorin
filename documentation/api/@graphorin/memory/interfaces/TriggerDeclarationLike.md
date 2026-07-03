[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / TriggerDeclarationLike

# Interface: TriggerDeclarationLike

Defined in: packages/memory/src/consolidator/scheduler.ts:50

Subset of `@graphorin/triggers`'s `TriggerDeclaration` accepted
by [SchedulerLike.register](/api/@graphorin/memory/interfaces/SchedulerLike.md#register). Field names mirror the
upstream shape exactly so the structural type is interchangeable
with the real export.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-callback"></a> `callback` | `readonly` | (`payload?`) => `void` \| `Promise`\&lt;`void`\&gt; | packages/memory/src/consolidator/scheduler.ts:54 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/memory/src/consolidator/scheduler.ts:51 |
| <a id="property-kind"></a> `kind` | `readonly` | `"idle"` \| `"cron"` \| `"event"` \| `"interval"` | packages/memory/src/consolidator/scheduler.ts:52 |
| <a id="property-options"></a> `options` | `readonly` | \{ `acknowledgeLibMode?`: `boolean`; `catchupPolicy?`: [`ConsolidatorCatchupPolicy`](/api/@graphorin/memory/type-aliases/ConsolidatorCatchupPolicy.md); `catchupWindowMs?`: `number`; `maxCatchupRuns?`: `number`; `tags?`: readonly `string`[]; \} | packages/memory/src/consolidator/scheduler.ts:55 |
| `options.acknowledgeLibMode?` | `readonly` | `boolean` | packages/memory/src/consolidator/scheduler.ts:60 |
| `options.catchupPolicy?` | `readonly` | [`ConsolidatorCatchupPolicy`](/api/@graphorin/memory/type-aliases/ConsolidatorCatchupPolicy.md) | packages/memory/src/consolidator/scheduler.ts:56 |
| `options.catchupWindowMs?` | `readonly` | `number` | packages/memory/src/consolidator/scheduler.ts:58 |
| `options.maxCatchupRuns?` | `readonly` | `number` | packages/memory/src/consolidator/scheduler.ts:57 |
| `options.tags?` | `readonly` | readonly `string`[] | packages/memory/src/consolidator/scheduler.ts:59 |
| <a id="property-spec"></a> `spec` | `readonly` | `string` | packages/memory/src/consolidator/scheduler.ts:53 |
