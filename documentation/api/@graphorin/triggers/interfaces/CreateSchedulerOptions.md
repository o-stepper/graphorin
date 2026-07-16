[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / CreateSchedulerOptions

# Interface: CreateSchedulerOptions

Defined in: [packages/triggers/src/index.ts:305](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L305)

Options for [createScheduler](/api/@graphorin/triggers/functions/createScheduler.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_resetlibmodeflag"></a> `_resetLibModeFlag?` | `readonly` | `boolean` | **`Internal`** Resets the per-process WARN-once flag. Used by the test suite to verify the warning fires exactly once per run. | [packages/triggers/src/index.ts:330](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L330) |
| <a id="property-cleartimeout"></a> `clearTimeout?` | `readonly` | (`handle`) => `void` | - | [packages/triggers/src/index.ts:317](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L317) |
| <a id="property-limits"></a> `limits?` | `readonly` | [`SchedulerLimits`](/api/@graphorin/triggers/interfaces/SchedulerLimits.md) | Opt-in scheduler harness (C4): interval floor + declaration cap enforced at `register(...)` time. Absent = no constraints (the pre-harness behaviour). Pass `{}` for the conservative defaults. | [packages/triggers/src/index.ts:323](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L323) |
| <a id="property-mode"></a> `mode?` | `readonly` | `"lib"` \| `"server"` | Default `'lib'`. Server mode skips the lib-mode warning. | [packages/triggers/src/index.ts:308](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L308) |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Override the wall clock - used by tests. | [packages/triggers/src/index.ts:310](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L310) |
| <a id="property-settimeout"></a> `setTimeout?` | `readonly` | (`cb`, `ms`) => `unknown` | Override `setTimeout`. The callback receives the chosen delay in milliseconds; the return value is the handle the scheduler later passes to `clearTimeout`. Tests inject a controllable timer. | [packages/triggers/src/index.ts:316](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L316) |
| <a id="property-store"></a> `store` | `readonly` | [`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md) | - | [packages/triggers/src/index.ts:306](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L306) |
