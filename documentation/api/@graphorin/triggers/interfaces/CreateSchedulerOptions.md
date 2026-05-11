[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / CreateSchedulerOptions

# Interface: CreateSchedulerOptions

Defined in: packages/triggers/src/index.ts:168

Options for [createScheduler](/api/@graphorin/triggers/functions/createScheduler.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-_resetlibmodeflag"></a> `_resetLibModeFlag?` | `readonly` | `boolean` | **`Internal`** Resets the per-process WARN-once flag. Used by the test suite to verify the warning fires exactly once per run. | packages/triggers/src/index.ts:187 |
| <a id="property-cleartimeout"></a> `clearTimeout?` | `readonly` | (`handle`) => `void` | - | packages/triggers/src/index.ts:180 |
| <a id="property-mode"></a> `mode?` | `readonly` | `"lib"` \| `"server"` | Default `'lib'`. Server mode skips the lib-mode warning. | packages/triggers/src/index.ts:171 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Override the wall clock — used by tests. | packages/triggers/src/index.ts:173 |
| <a id="property-settimeout"></a> `setTimeout?` | `readonly` | (`cb`, `ms`) => `unknown` | Override `setTimeout`. The callback receives the chosen delay in milliseconds; the return value is the handle the scheduler later passes to `clearTimeout`. Tests inject a controllable timer. | packages/triggers/src/index.ts:179 |
| <a id="property-store"></a> `store` | `readonly` | [`TriggerStore`](/api/@graphorin/core/interfaces/TriggerStore.md) | - | packages/triggers/src/index.ts:169 |
