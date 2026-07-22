[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / CreateSchedulerOptions

# Interface: CreateSchedulerOptions

Defined in: packages/triggers/src/index.ts:305

**`Stable`**

Options for [createScheduler](/api/@graphorin/triggers/functions/createScheduler.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_resetlibmodeflag"></a> `_resetLibModeFlag?` | `readonly` | `boolean` | **`Internal`** Resets the per-process WARN-once flag. Used by the test suite to verify the warning fires exactly once per run. | packages/triggers/src/index.ts:330 |
| <a id="property-cleartimeout"></a> `clearTimeout?` | `readonly` | (`handle`) => `void` | - | packages/triggers/src/index.ts:317 |
| <a id="property-limits"></a> `limits?` | `readonly` | [`SchedulerLimits`](/api/@graphorin/triggers/interfaces/SchedulerLimits.md) | Opt-in scheduler harness: interval floor + declaration cap enforced at `register(...)` time. Absent = no constraints (the pre-harness behaviour). Pass `{}` for the conservative defaults. | packages/triggers/src/index.ts:323 |
| <a id="property-mode"></a> `mode?` | `readonly` | `"lib"` \| `"server"` | Default `'lib'`. Server mode skips the lib-mode warning. | packages/triggers/src/index.ts:308 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Override the wall clock - used by tests. | packages/triggers/src/index.ts:310 |
| <a id="property-settimeout"></a> `setTimeout?` | `readonly` | (`cb`, `ms`) => `unknown` | Override `setTimeout`. The callback receives the chosen delay in milliseconds; the return value is the handle the scheduler later passes to `clearTimeout`. Tests inject a controllable timer. | packages/triggers/src/index.ts:316 |
| <a id="property-store"></a> `store` | `readonly` | [`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md) | - | packages/triggers/src/index.ts:306 |
