[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / CreateSchedulerOptions

# Interface: CreateSchedulerOptions

Defined in: [packages/triggers/src/index.ts:207](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L207)

Options for [createScheduler](/api/@graphorin/triggers/functions/createScheduler.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_resetlibmodeflag"></a> `_resetLibModeFlag?` | `readonly` | `boolean` | **`Internal`** Resets the per-process WARN-once flag. Used by the test suite to verify the warning fires exactly once per run. | [packages/triggers/src/index.ts:226](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L226) |
| <a id="property-cleartimeout"></a> `clearTimeout?` | `readonly` | (`handle`) => `void` | - | [packages/triggers/src/index.ts:219](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L219) |
| <a id="property-mode"></a> `mode?` | `readonly` | `"lib"` \| `"server"` | Default `'lib'`. Server mode skips the lib-mode warning. | [packages/triggers/src/index.ts:210](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L210) |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Override the wall clock - used by tests. | [packages/triggers/src/index.ts:212](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L212) |
| <a id="property-settimeout"></a> `setTimeout?` | `readonly` | (`cb`, `ms`) => `unknown` | Override `setTimeout`. The callback receives the chosen delay in milliseconds; the return value is the handle the scheduler later passes to `clearTimeout`. Tests inject a controllable timer. | [packages/triggers/src/index.ts:218](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L218) |
| <a id="property-store"></a> `store` | `readonly` | [`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md) | - | [packages/triggers/src/index.ts:208](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L208) |
