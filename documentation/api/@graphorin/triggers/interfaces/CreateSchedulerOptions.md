[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / CreateSchedulerOptions

# Interface: CreateSchedulerOptions

Defined in: [packages/triggers/src/index.ts:177](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L177)

Options for [createScheduler](/api/@graphorin/triggers/functions/createScheduler.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_resetlibmodeflag"></a> `_resetLibModeFlag?` | `readonly` | `boolean` | **`Internal`** Resets the per-process WARN-once flag. Used by the test suite to verify the warning fires exactly once per run. | [packages/triggers/src/index.ts:196](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L196) |
| <a id="property-cleartimeout"></a> `clearTimeout?` | `readonly` | (`handle`) => `void` | - | [packages/triggers/src/index.ts:189](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L189) |
| <a id="property-mode"></a> `mode?` | `readonly` | `"lib"` \| `"server"` | Default `'lib'`. Server mode skips the lib-mode warning. | [packages/triggers/src/index.ts:180](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L180) |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Override the wall clock - used by tests. | [packages/triggers/src/index.ts:182](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L182) |
| <a id="property-settimeout"></a> `setTimeout?` | `readonly` | (`cb`, `ms`) => `unknown` | Override `setTimeout`. The callback receives the chosen delay in milliseconds; the return value is the handle the scheduler later passes to `clearTimeout`. Tests inject a controllable timer. | [packages/triggers/src/index.ts:188](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L188) |
| <a id="property-store"></a> `store` | `readonly` | [`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md) | - | [packages/triggers/src/index.ts:178](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L178) |
