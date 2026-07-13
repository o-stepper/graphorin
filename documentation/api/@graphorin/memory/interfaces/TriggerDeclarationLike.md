[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / TriggerDeclarationLike

# Interface: TriggerDeclarationLike

Defined in: [packages/memory/src/consolidator/scheduler.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L63)

Subset of `@graphorin/triggers`'s `TriggerDeclaration` accepted
by [SchedulerLike.register](/api/@graphorin/memory/interfaces/SchedulerLike.md#register). Field names mirror the
upstream shape exactly so the structural type is interchangeable
with the real export.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-callback"></a> `callback` | `readonly` | (`payload?`) => `void` \| `Promise`\&lt;`void`\&gt; | [packages/memory/src/consolidator/scheduler.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L67) |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/memory/src/consolidator/scheduler.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L64) |
| <a id="property-kind"></a> `kind` | `readonly` | `"idle"` \| `"cron"` \| `"event"` \| `"interval"` | [packages/memory/src/consolidator/scheduler.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L65) |
| <a id="property-options"></a> `options` | `readonly` | \{ `acknowledgeLibMode?`: `boolean`; `catchupPolicy?`: [`ConsolidatorCatchupPolicy`](/api/@graphorin/memory/type-aliases/ConsolidatorCatchupPolicy.md); `catchupWindowMs?`: `number`; `maxCatchupRuns?`: `number`; `tags?`: readonly `string`[]; \} | [packages/memory/src/consolidator/scheduler.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L68) |
| `options.acknowledgeLibMode?` | `readonly` | `boolean` | [packages/memory/src/consolidator/scheduler.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L73) |
| `options.catchupPolicy?` | `readonly` | [`ConsolidatorCatchupPolicy`](/api/@graphorin/memory/type-aliases/ConsolidatorCatchupPolicy.md) | [packages/memory/src/consolidator/scheduler.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L69) |
| `options.catchupWindowMs?` | `readonly` | `number` | [packages/memory/src/consolidator/scheduler.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L71) |
| `options.maxCatchupRuns?` | `readonly` | `number` | [packages/memory/src/consolidator/scheduler.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L70) |
| `options.tags?` | `readonly` | readonly `string`[] | [packages/memory/src/consolidator/scheduler.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L72) |
| <a id="property-spec"></a> `spec` | `readonly` | `string` | [packages/memory/src/consolidator/scheduler.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L66) |
