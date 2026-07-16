[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / SchedulerLimits

# Interface: SchedulerLimits

Defined in: [packages/triggers/src/index.ts:285](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L285)

Opt-in scheduler harness for proactive task fleets (C4). Values are
bot policy; the defaults are conservative.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-intervalfloorms"></a> `intervalFloorMs?` | `readonly` | `number` | Floor for `interval` / `idle` periods, in milliseconds. `register(...)` throws [TriggerLimitError](/api/@graphorin/triggers/classes/TriggerLimitError.md) for a shorter period. `cron` triggers are minute-grained by construction and are not floored. Default 60000 (60s); `0` disables the floor. | [packages/triggers/src/index.ts:292](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L292) |
| <a id="property-maxdeclarations"></a> `maxDeclarations?` | `readonly` | `number` | Maximum number of registered declarations. Re-registering an existing id never counts against the cap. Default: unlimited. | [packages/triggers/src/index.ts:297](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L297) |
