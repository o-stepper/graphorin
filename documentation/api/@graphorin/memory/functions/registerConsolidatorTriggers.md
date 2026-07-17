[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / registerConsolidatorTriggers

# Function: registerConsolidatorTriggers()

```ts
function registerConsolidatorTriggers(
   consolidator, 
   scheduler, 
options): Promise<RegisterTriggersResult>;
```

Defined in: [packages/memory/src/consolidator/scheduler.ts:138](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L138)

Register every cron / idle / interval trigger declared on the
supplied consolidator with the scheduler. Each trigger fires
`consolidator.trigger(reason, scope)` so the lib-mode + server
paths converge on the same handler.

Turn triggers (`turn:N`) and event triggers (`event:NAME`) are
skipped - the scheduler cannot count user turns autonomously, and
event triggers fire from the consumer's emit path. The runtime
caller is responsible for those (e.g. invoking
`consolidator.trigger(...)` from the agent loop).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `consolidator` | `ConsolidatorLike` |
| `scheduler` | [`SchedulerLike`](/api/@graphorin/memory/interfaces/SchedulerLike.md) |
| `options` | [`RegisterTriggersOptions`](/api/@graphorin/memory/interfaces/RegisterTriggersOptions.md) |

## Returns

`Promise`\&lt;[`RegisterTriggersResult`](/api/@graphorin/memory/interfaces/RegisterTriggersResult.md)\&gt;

## Stable
